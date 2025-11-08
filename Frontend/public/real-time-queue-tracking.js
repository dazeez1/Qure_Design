"use strict";

// API Configuration
const API_BASE_URL = "https://qure-design.onrender.com/api";

// DOM Elements
const queueTableBody = document.getElementById("queue-table-body");
const updateTimeElement = document.getElementById("update-time");
const refreshButton = document.getElementById("refresh-button");
const loadingState = document.getElementById("loading-state");
const emptyState = document.getElementById("empty-state");
const yourQueueStatus = document.getElementById("your-queue-status");
const queueNumberDisplay = document.getElementById("queue-number-display");
const positionInfo = document.getElementById("position-info");
const etaInfo = document.getElementById("eta-info");
const mobileMenuToggle = document.getElementById("mobile-menu-toggle");
const mobileNavigation = document.getElementById("mobile-navigation");
const mobileCloseButton = document.getElementById("mobile-close-button");

// Queue data and state management
let queueData = [];
let lastUpdateTime = new Date();
let autoRefreshInterval = null;
let isRefreshing = false;

// Utility Functions
const getAuthHeaders = () => {
  const token = localStorage.getItem("authToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

const handleApiError = (error, defaultMessage = "An error occurred") => {
  console.error("API Error:", error);
  if (error.response) {
    return error.response.data?.message || defaultMessage;
  }
  return error.message || defaultMessage;
};

const makeApiCall = async (endpoint, options = {}) => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = getAuthHeaders();

    console.log("=== Making API Call ===");
    console.log("URL:", url);
    console.log("Headers:", headers);
    console.log("Options:", options);

    const response = await fetch(url, {
      headers,
      ...options,
    });

    console.log("Response status:", response.status);
    console.log("Response ok:", response.ok);
    console.log(
      "Response headers:",
      Object.fromEntries(response.headers.entries())
    );

    const data = await response.json();
    console.log("Response data:", data);

    if (!response.ok) {
      console.log("❌ Response not ok, status:", response.status);
      // Don't treat 404 as an error for queue status - it just means user is not in queue
      if (response.status === 404 && endpoint === "/queues/status") {
        console.log("404 for queue status - user not in queue");
        return { success: false, message: data.message };
      }
      throw new Error(data.message || `HTTP ${response.status}`);
    }

    console.log("✅ API call successful");
    return data;
  } catch (error) {
    console.error("❌ API call failed:", error);
    throw error;
  }
};

// Utility functions
const formatTimeAgo = (date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds} secs ago`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} min${minutes > 1 ? "s" : ""} ago`;
  } else {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hr${hours > 1 ? "s" : ""} ago`;
  }
};

const updateTimeDisplay = () => {
  updateTimeElement.textContent = formatTimeAgo(lastUpdateTime);
};

const getStatusBadgeClass = (status) => {
  switch (status) {
    case "called":
      return "status-badge status-now-serving";
    case "waiting":
      return "status-badge status-waiting";
    case "completed":
      return "status-badge status-completed";
    case "cancelled":
      return "status-badge status-cancelled";
    default:
      return "status-badge status-waiting";
  }
};

const getStatusText = (status, position, estimatedWaitTime) => {
  switch (status) {
    case "called":
      return "Now Serving";
    case "waiting":
      return `Position ${position} • ${estimatedWaitTime || 0} min wait`;
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    default:
      return "Waiting";
  }
};

const createQueueRow = (queueItem) => {
  const row = document.createElement("div");
  row.className = "queue-table-row";
  row.setAttribute("data-queue-id", queueItem._id);

  // Get patient name from the formatted data
  const patientName = queueItem.patientName || "Unknown Patient";

  const statusText = getStatusText(
    queueItem.status,
    queueItem.position,
    queueItem.estimatedWaitTime
  );

  row.innerHTML = `
    <div class="table-cell">
      <span class="patient-name">${patientName}</span>
    </div>
    <div class="table-cell">
      <span class="queue-number">${queueItem.queueNumber}</span>
      <span class="service-name">${queueItem.specialty}</span>
    </div>
    <div class="table-cell status-cell">
      <span class="position-info">Position ${queueItem.position}</span>
      <span class="${getStatusBadgeClass(
        queueItem.status
      )}">${statusText}</span>
    </div>
  `;

  return row;
};

const renderQueueTable = (data) => {
  queueTableBody.innerHTML = "";

  if (!data || data.length === 0) {
    loadingState.style.display = "none";
    emptyState.style.display = "flex";
    yourQueueStatus.style.display = "none";
    // Update empty state message
    const emptyTitle = document.querySelector(".empty-title");
    const emptyDescription = document.querySelector(".empty-description");
    if (emptyTitle) emptyTitle.textContent = "No patients in queue";
    if (emptyDescription)
      emptyDescription.textContent =
        "The queue is currently empty. Join a queue from the dashboard to see your position here.";
    return;
  }

  emptyState.style.display = "none";

  // Find current user's queue from all queues
  const userData = localStorage.getItem("user");
  let userQueue = null;

  if (userData) {
    try {
      const user = JSON.parse(userData);
      const userFullName = `${user.firstName} ${user.lastName}`;
      userQueue = data.find((queue) => queue.patientName === userFullName);
    } catch (error) {
      console.error("Error parsing user data:", error);
    }
  }

  // Show user's queue status if they are in a queue
  if (userQueue) {
    yourQueueStatus.style.display = "block";
    updateUserQueueStatus(userQueue);
  } else {
    yourQueueStatus.style.display = "none";
  }

  // Show all queues in the table
  data.forEach((queueItem) => {
    const row = createQueueRow(queueItem);
    queueTableBody.appendChild(row);
  });
};

const updateUserQueueStatus = (queueData) => {
  if (queueNumberDisplay) {
    queueNumberDisplay.textContent = `Queue Number: ${queueData.queueNumber}`;
  }

  if (positionInfo) {
    const statusText =
      queueData.status === "called"
        ? "You are being served now!"
        : `Position ${queueData.position} in queue`;
    positionInfo.textContent = statusText;
  }

  if (etaInfo) {
    const etaText =
      queueData.status === "called"
        ? "Please proceed to the consultation room"
        : `Estimated wait time: ${queueData.estimatedWaitTime || 0} minutes`;
    etaInfo.textContent = etaText;
  }
};

const showLoadingState = () => {
  loadingState.style.display = "flex";
  emptyState.style.display = "none";
};

const hideLoadingState = () => {
  loadingState.style.display = "none";
};

// Backend integration for queue data
const fetchQueueData = async () => {
  try {
    console.log("=== Fetching Queue Data ===");
    console.log(
      "Auth token:",
      localStorage.getItem("authToken") ? "Present" : "Missing"
    );
    console.log(
      "User data:",
      localStorage.getItem("user") ? "Present" : "Missing"
    );

    const token = localStorage.getItem("authToken");
    console.log("Token length:", token ? token.length : 0);
    console.log("Token starts with:", token ? token.substring(0, 10) : "null");

    console.log("Making API call to /queues/all...");
    const response = await makeApiCall("/queues/all");

    console.log("✅ All queues response received:", response);
    console.log("Response data type:", typeof response.data);
    console.log(
      "Response data length:",
      response.data ? response.data.length : "null"
    );

    if (response.success && response.data) {
      // Return all queues as an array
      const queueData = Array.isArray(response.data)
        ? response.data
        : [response.data];
      console.log("Processed queue data:", queueData);
      return queueData;
    } else {
      // No queue data available
      console.log("No queue data available:", response.message);
      return [];
    }
  } catch (error) {
    console.error("Error fetching queue data:", error);
    console.error("Error details:", {
      message: error.message,
      status: error.status,
      response: error.response,
    });

    // Check if it's an authentication error
    if (
      error.message &&
      (error.message.includes("401") ||
        error.message.includes("Unauthorized") ||
        error.message.includes("Invalid or expired token"))
    ) {
      console.log("Authentication error detected, redirecting to login");
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      window.location.href = "login.html";
      return [];
    }

    if (error.message && error.message.includes("not currently in any queue")) {
      // User is not in a queue - this is expected
      return [];
    }
    throw error;
  }
};

const refreshQueueData = async () => {
  if (isRefreshing) return;

  isRefreshing = true;
  refreshButton.classList.add("refreshing");
  showLoadingState();

  try {
    const newData = await fetchQueueData();
    queueData = newData;
    renderQueueTable(queueData);
    lastUpdateTime = new Date();
    updateTimeDisplay();
  } catch (error) {
    console.error("Error fetching queue data:", error);

    // Check if it's an authentication error
    if (
      error.message &&
      (error.message.includes("401") ||
        error.message.includes("Unauthorized") ||
        error.message.includes("Invalid or expired token"))
    ) {
      console.log("Authentication error in refresh, redirecting to login");
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      window.location.href = "login.html";
      return;
    }

    // For other errors, just show empty state
    renderQueueTable([]);
  } finally {
    isRefreshing = false;
    refreshButton.classList.remove("refreshing");
    hideLoadingState();
  }
};

const startAutoRefresh = () => {
  // Auto-refresh every 30 seconds to get real-time updates
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
  }

  autoRefreshInterval = setInterval(async () => {
    try {
      await refreshQueueData();
    } catch (error) {
      console.error("Auto-refresh error:", error);
    }
  }, 30000); // 30 seconds
};

const stopAutoRefresh = () => {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = null;
  }
};

// Mobile menu functionality
const toggleMobileMenu = () => {
  const isMenuOpen = mobileNavigation.classList.contains("active");

  if (isMenuOpen) {
    mobileNavigation.classList.remove("active");
    document.body.style.overflow = "auto";
  } else {
    mobileNavigation.classList.add("active");
    document.body.style.overflow = "hidden";
  }
};

const closeMobileMenu = () => {
  mobileNavigation.classList.remove("active");
  document.body.style.overflow = "auto";
};

// Keyboard shortcuts
const handleKeyboardShortcuts = (event) => {
  // R key to refresh
  if (event.key === "r" || event.key === "R") {
    event.preventDefault();
    refreshQueueData();
  }

  // Escape to close mobile menu
  if (event.key === "Escape") {
    closeMobileMenu();
  }
};

// Initialize page
const initializePage = async () => {
  console.log("=== Queue Tracking Page Initialization ===");

  // Check authentication
  const token = localStorage.getItem("authToken");
  const userData = localStorage.getItem("user");

  console.log("Token exists:", !!token);
  console.log("User data exists:", !!userData);
  console.log("Token value:", token ? token.substring(0, 20) + "..." : "null");
  console.log("User data value:", userData ? JSON.parse(userData) : "null");

  if (!token) {
    console.log("❌ No authentication token found, redirecting to login");
    window.location.href = "login.html";
    return;
  }

  // If user data is missing but token exists, we can still proceed
  // We'll validate the token with the backend
  if (!userData) {
    console.log(
      "⚠️ User data missing but token exists, proceeding with token validation"
    );
    console.log("✅ Will validate token with backend API");
  }

  // Only check user data if it exists
  if (userData) {
    try {
      const user = JSON.parse(userData);
      console.log("Parsed user:", user);
      console.log("User role:", user.role);

      if (user.role !== "patient") {
        console.log("❌ User is not a patient, redirecting to login");
        window.location.href = "login.html";
        return;
      }

      console.log("✅ User data validation passed");
    } catch (error) {
      console.error("❌ Error parsing user data:", error);
      console.log(
        "⚠️ User data parsing failed, but token exists - proceeding with backend validation"
      );
    }
  }

  console.log("✅ Authentication check passed (token-based)");

  showLoadingState();

  try {
    await refreshQueueData();
    startAutoRefresh();

    // Update time display every second
    setInterval(updateTimeDisplay, 1000);
  } catch (error) {
    console.error("Error initializing page:", error);
    // Don't redirect on initialization error, just show empty state
    hideLoadingState();
    renderQueueTable([]);
  }
};

// Event Listeners
refreshButton.addEventListener("click", refreshQueueData);
mobileMenuToggle.addEventListener("click", toggleMobileMenu);
mobileCloseButton.addEventListener("click", closeMobileMenu);

// Close mobile menu when clicking outside
document.addEventListener("click", (event) => {
  if (
    mobileNavigation.classList.contains("active") &&
    !mobileNavigation.contains(event.target) &&
    !mobileMenuToggle.contains(event.target)
  ) {
    closeMobileMenu();
  }
});

// Keyboard event listeners
document.addEventListener("keydown", handleKeyboardShortcuts);

// Handle page visibility changes
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    // Page became visible, refresh data and restart auto-refresh
    refreshQueueData();
    startAutoRefresh();
  } else {
    // Page became hidden, stop auto-refresh to save resources
    stopAutoRefresh();
  }
});

// Handle page unload
window.addEventListener("beforeunload", () => {
  stopAutoRefresh();
});

// Initialize page when DOM is loaded
document.addEventListener("DOMContentLoaded", initializePage);

// Export functions for testing (if needed)
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    fetchQueueData,
    formatTimeAgo,
    getStatusBadgeClass,
    createQueueRow,
    renderQueueTable,
  };
}
