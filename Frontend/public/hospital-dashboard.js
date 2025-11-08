"use strict";

// API Configuration - Production
const API_BASE_URL = "https://qure-design.onrender.com/api";

// Custom Popup Function - Production
function showCustomPopup(title, message, type = "info") {
  // Remove any existing popup
  const existingPopup = document.querySelector(".custom-popup");
  if (existingPopup) {
    existingPopup.remove();
  }

  // Create popup overlay
  const overlay = document.createElement("div");
  overlay.className = "custom-popup-overlay";
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    animation: fadeIn 0.3s ease;
  `;

  // Create popup content
  const popup = document.createElement("div");
  popup.className = "custom-popup";

  // Set colors based on type
  let iconColor, bgColor, borderColor;
  switch (type) {
    case "error":
      iconColor = "#ef4444";
      bgColor = "#fef2f2";
      borderColor = "#fecaca";
      break;
    case "success":
      iconColor = "#10b981";
      bgColor = "#f0fdf4";
      borderColor = "#bbf7d0";
      break;
    case "warning":
      iconColor = "#f59e0b";
      bgColor = "#fffbeb";
      borderColor = "#fed7aa";
      break;
    default: // info
      iconColor = "#3b82f6";
      bgColor = "#eff6ff";
      borderColor = "#bfdbfe";
  }

  popup.style.cssText = `
    background: white;
    border-radius: 12px;
    padding: 2rem;
    max-width: 400px;
    width: 90%;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    border: 2px solid ${borderColor};
    animation: slideIn 0.3s ease;
    position: relative;
  `;

  // Create icon
  const icon = document.createElement("div");
  icon.style.cssText = `
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background-color: ${bgColor};
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1rem;
    border: 2px solid ${borderColor};
  `;

  const iconSymbol = document.createElement("span");
  iconSymbol.style.cssText = `
    font-size: 24px;
    color: ${iconColor};
    font-weight: bold;
  `;

  // Set icon based on type
  switch (type) {
    case "error":
      iconSymbol.textContent = "!";
      break;
    case "success":
      iconSymbol.textContent = "✓";
      break;
    case "warning":
      iconSymbol.textContent = "⚠";
      break;
    default:
      iconSymbol.textContent = "i";
  }

  icon.appendChild(iconSymbol);

  // Create title
  const titleEl = document.createElement("h3");
  titleEl.textContent = title;
  titleEl.style.cssText = `
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 0.5rem 0;
    text-align: center;
  `;

  // Create message
  const messageEl = document.createElement("p");
  messageEl.textContent = message;
  messageEl.style.cssText = `
    color: #6b7280;
    margin: 0 0 1.5rem 0;
    text-align: center;
    line-height: 1.5;
  `;

  // Create close button
  const closeBtn = document.createElement("button");
  closeBtn.textContent = "OK";
  closeBtn.style.cssText = `
    background-color: ${iconColor};
    color: white;
    border: none;
    padding: 0.75rem 2rem;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    width: 100%;
    font-size: 1rem;
    transition: all 0.2s ease;
  `;

  closeBtn.addEventListener("mouseenter", () => {
    closeBtn.style.opacity = "0.9";
    closeBtn.style.transform = "translateY(-1px)";
  });

  closeBtn.addEventListener("mouseleave", () => {
    closeBtn.style.opacity = "1";
    closeBtn.style.transform = "translateY(0)";
  });

  closeBtn.addEventListener("click", () => {
    overlay.remove();
  });

  // Assemble popup
  popup.appendChild(icon);
  popup.appendChild(titleEl);
  popup.appendChild(messageEl);
  popup.appendChild(closeBtn);
  overlay.appendChild(popup);

  // Add to document
  document.body.appendChild(overlay);

  // Close on overlay click
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      overlay.remove();
    }
  });

  // Close on Escape key
  const handleEscape = (e) => {
    if (e.key === "Escape") {
      overlay.remove();
      document.removeEventListener("keydown", handleEscape);
    }
  };
  document.addEventListener("keydown", handleEscape);
}

// Authentication Check
document.addEventListener("DOMContentLoaded", () => {
  // Check if access code is validated
  const staffAccessValidated = localStorage.getItem("staffAccessValidated");
  const staffAccessCode = localStorage.getItem("staffAccessCode");

  if (!staffAccessValidated || !staffAccessCode) {
    // Redirect to access page if not validated
    window.location.href = "access.html";
    return;
  }

  // Check if user is logged in (optional for staff dashboard)
  const userData = localStorage.getItem("user");
  const authToken = localStorage.getItem("authToken");

  if (userData && authToken) {
    // Parse user data if logged in
    try {
      const user = JSON.parse(userData);
      if (user.role === "staff") {
        // Update hospital name if available
        if (user.hospitalName) {
          updateHospitalInfo(user.hospitalName);
          const hospitalDropdown = document.querySelector(".hosp-btn");
          if (hospitalDropdown) {
            hospitalDropdown.setAttribute("disabled", "true");
            hospitalDropdown.style.opacity = "0.7";
            hospitalDropdown.style.cursor = "not-allowed";
          }
        }
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
    }
  }

  // Load dashboard data
  loadDashboardData();

  // Initialize Socket.IO for real-time updates
  initializeSocketIO();

  // Start live polling every 30s as fallback (reduced frequency)
  startQueuePolling();

  // Wire up toolbar buttons
  const exportBtn = document.getElementById("exportCsv");
  if (exportBtn) exportBtn.addEventListener("click", exportQueueCsv);
  const openAnn = document.getElementById("openAnnouncement");
  if (openAnn) openAnn.addEventListener("click", openAnnouncementModal);
  // Remove Add Staff wiring (UI removed)
});

// Update hospital information in the UI
function updateHospitalInfo(hospitalName) {
  // Update hospital dropdown if it exists
  const hospitalLabel = document.getElementById("hospitalNameLabel");
  if (hospitalLabel && hospitalName) {
    hospitalLabel.textContent = hospitalName;
    try {
      localStorage.setItem("lastHospitalName", hospitalName);
    } catch (_) {}
  }

  // Update any other hospital-specific elements
}

// Load dashboard data
async function loadDashboardData() {
  try {
    // Load queue data
    await loadQueueData();

    // Load analytics data
    await loadAnalyticsData();

    // Waiting rooms functionality moved to wait-management.html

    // Department status will be loaded by auto-refresh every 30 minutes
    // No initial load to prevent placeholder showing

    console.log("Dashboard data loaded successfully");
  } catch (error) {
    console.error("Error loading dashboard data:", error);
    showCustomPopup(
      "Error",
      "Failed to load dashboard data. Please refresh the page.",
      "error"
    );
  }
}

// Show loading state in queue table
function showQueueLoadingState() {
  const tableBody = document.querySelector(".queue-list tbody");
  if (!tableBody) return;

  tableBody.innerHTML = `
    <tr>
      <td colspan="6" style="text-align: center; padding: 2rem; color: #6b7280;">
        <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
          <div style="width: 20px; height: 20px; border: 2px solid #e5e7eb; border-top: 2px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite;"></div>
          Loading queue data...
        </div>
      </td>
    </tr>
  `;
}

// Load queue data from backend
async function loadQueueData() {
  try {
    // Show loading state only if table is empty (first load)
    const tableBody = document.querySelector(".queue-list tbody");
    if (tableBody && tableBody.children.length === 0) {
      showQueueLoadingState();
    }

    const user = JSON.parse(localStorage.getItem("user") || "null");
    let hospitalName =
      user?.hospitalName || localStorage.getItem("lastHospitalName") || "";
    if (!hospitalName) {
      const label = document
        .getElementById("hospitalNameLabel")
        ?.textContent?.trim();
      if (label && label.toLowerCase() !== "hospital") hospitalName = label;
    }

    const isValidHospital =
      hospitalName &&
      hospitalName.toLowerCase() !== "select hospital" &&
      hospitalName !== "Hospital";
    const url = isValidHospital
      ? `https://qure-design.onrender.com/api/queues/hospital?hospitalName=${encodeURIComponent(
          hospitalName
        )}`
      : `https://qure-design.onrender.com/api/queues/all`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      const rows = Array.isArray(data.data)
        ? data.data
        : data.data?.queues || [];
      updateQueueTable(rows);
      if (isValidHospital) {
        updateHospitalInfo(hospitalName);
      } else {
        const last = localStorage.getItem("lastHospitalName");
        if (last) updateHospitalInfo(last);
      }
    } else {
      console.log("No queue data available or not authenticated");
      updateQueueTable([]);
    }
  } catch (error) {
    console.error("Error loading queue data:", error);
    updateQueueTable([]);
  }
}

// Update queue table with real data
function updateQueueTable(queues) {
  const tableBody = document.querySelector(".queue-list tbody");
  if (!tableBody) return;

  // Clear existing rows
  tableBody.innerHTML = "";

  if (!queues || queues.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 2rem; color: #6b7280;">
          No patients in queue
        </td>
      </tr>
    `;
    return;
  }

  // Add queue rows
  queues.forEach((queue) => {
    const row = document.createElement("tr");
    const action = getActionIcon(queue.status);
    const patient = queue.patient || {};
    const patientName =
      queue.patientName ||
      `${patient.firstName || ""} ${patient.lastName || ""}`.trim() ||
      "Unknown";

    // Create status-based action icons
    let actionHTML = "";
    if (queue.status === "waiting") {
      actionHTML = `
        <span class="material-symbols-outlined call-action" 
              data-queue-id="${queue.id || queue._id}" 
              data-patient-name="${patientName}" 
              data-ticket="${queue.queueNumber}"
              title="Call Patient">phone</span>
      `;
    } else if (queue.status === "called") {
      actionHTML = `
        <span class="material-symbols-outlined complete-action" 
              data-queue-id="${queue.id || queue._id}" 
              data-patient-name="${patientName}" 
              data-ticket="${queue.queueNumber}"
              title="Mark as Complete">check</span>
      `;
    } else {
      actionHTML = `<span class="material-symbols-outlined ${action.className}">${action.icon}</span>`;
    }

    row.innerHTML = `
      <td>${patientName}</td>
      <td>${queue.queueNumber}</td>
      <td>${queue.specialty}</td>
      <td>${queue.status}</td>
      <td>${queue.estimatedWaitTime || 0} mins</td>
      <td class="action-cell">${actionHTML}</td>
    `;

    tableBody.appendChild(row);
  });

  // Update stats
  updateStats();

  // Add event handlers for action icons
  addActionIconHandlers();

  // Hook up search filter
  const searchInput = document.querySelector(".search-input");
  if (searchInput && !searchInput._wired) {
    searchInput._wired = true;
    searchInput.addEventListener("input", () =>
      filterBySearch(searchInput.value)
    );
  }
}

function filterBySearch(query) {
  const q = (query || "").toLowerCase().trim();
  const rows = Array.from(document.querySelectorAll(".queue-list tbody tr"));
  rows.forEach((row) => {
    const name = (row.cells[0]?.innerText || "").toLowerCase();
    const ticket = (row.cells[1]?.innerText || "").toLowerCase();
    row.style.display =
      !q || name.includes(q) || ticket.includes(q) ? "" : "none";
  });
  updateStats();
}

// Initialize Socket.IO for real-time updates
function initializeSocketIO() {
  if (!window.socketClient) {
    console.error("Socket.IO client not available");
    return;
  }

  // Connect to Socket.IO
  window.socketClient.connect();

  // Handle Socket.IO connection events
  window.socketClient.on("connected", (data) => {
    console.log("Socket.IO connected:", data);
    showCustomPopup("Connected", "Real-time updates enabled", "success");
  });

  window.socketClient.on("disconnected", (data) => {
    console.log("Socket.IO disconnected:", data);
    showCustomPopup("Disconnected", "Real-time updates disabled", "warning");
  });

  window.socketClient.on("error", (error) => {
    console.error("Socket.IO error:", error);
  });

  // Handle queue updates
  window.socketClient.on("queueUpdate", (data) => {
    console.log("Queue update received:", data);
    handleQueueUpdate(data);
  });

  // Handle waiting room updates
  window.socketClient.on("waitingRoomUpdate", (data) => {
    console.log("Waiting room update received:", data);
    handleWaitingRoomUpdate(data);
  });

  // Handle announcements
  window.socketClient.on("announcement", (data) => {
    console.log("Announcement received:", data);
    showCustomPopup(
      "Announcement",
      data.message || "New hospital announcement",
      "info"
    );
  });
}

// Handle real-time queue updates
function handleQueueUpdate(data) {
  // Refresh queue data when updates are received
  loadQueueData();

  // Show notification for specific events
  if (data.type === "patient_joined") {
    const patientName = data.queue.patient
      ? `${data.queue.patient.firstName} ${data.queue.patient.lastName}`
      : "New patient";
    showCustomPopup(
      "New Patient",
      `${patientName} joined the ${data.queue.specialty} queue`,
      "info"
    );
  } else if (data.type === "patient_called") {
    const patientName = data.queue.patient
      ? `${data.queue.patient.firstName} ${data.queue.patient.lastName}`
      : "Patient";
    showCustomPopup(
      "Patient Called",
      `${patientName} (${data.queue.queueNumber}) has been called`,
      "success"
    );
  }
}

// Handle real-time waiting room updates
function handleWaitingRoomUpdate(data) {
  console.log("Waiting room update:", data);

  // Update occupancy display if on waiting room page
  if (window.location.pathname.includes("wait-management")) {
    // Trigger waiting room refresh
    if (
      window.loadWaitingRooms &&
      typeof window.loadWaitingRooms === "function"
    ) {
      window.loadWaitingRooms();
    }
  }

  // Show notification for occupancy updates
  if (data.type === "occupancy_updated") {
    showCustomPopup(
      "Occupancy Updated",
      `Room occupancy: ${data.currentOccupancy}/${data.capacity} (${data.occupancyPercentage}%)`,
      "info"
    );
  }
}

function startQueuePolling() {
  if (window.__queuePoll) clearInterval(window.__queuePoll);
  window.__queuePoll = setInterval(async () => {
    await loadQueueData();
    // Removed loadAnalyticsData() to prevent frequent "Loading staff data..." messages
    // Analytics will be refreshed by the 30-minute auto-refresh
  }, 30000); // Changed from 5 seconds to 30 seconds
}

async function exportQueueCsv() {
  const rows = Array.from(document.querySelectorAll(".queue-list tbody tr"));
  const headers = ["Name", "Ticket", "Department", "Status", "Waiting Time"];
  const data = rows.map((r) => [
    r.cells[0]?.innerText || "",
    r.cells[1]?.innerText || "",
    r.cells[2]?.innerText || "",
    r.cells[3]?.innerText || "",
    r.cells[4]?.innerText || "",
  ]);
  const csv = [headers, ...data]
    .map((row) =>
      row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `queues-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function openAnnouncementModal() {
  const msg = prompt("Announcement message to all patients in hospital?");
  if (!msg) return;
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const hospitalName =
    user?.hospitalName ||
    document.getElementById("hospitalNameLabel")?.textContent?.trim();
  fetch("https://qure-design.onrender.com/api/notifications", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: `Announcement - ${hospitalName}`,
      message: msg,
      type: "announcement",
      audience: "hospital",
      hospitalName,
      priority: "high",
    }),
  })
    .then((r) => r.json())
    .then(() =>
      showCustomPopup("Announcement", "Announcement sent.", "success")
    )
    .catch(() =>
      showCustomPopup("Error", "Failed to send announcement.", "error")
    );
}

function openAddStaffModal() {
  const firstName = prompt("Staff first name?");
  if (!firstName) return;
  const lastName = prompt("Staff last name?") || "";
  const email = prompt("Staff email?");
  if (!email) return;
  const phone = prompt("Staff phone?") || "";
  const password =
    prompt("Temporary password? (min 8 chars)") || "StaffPass123!";
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const hospitalName =
    user?.hospitalName ||
    document.getElementById("hospitalNameLabel")?.textContent?.trim();
  fetch("https://qure-design.onrender.com/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firstName,
      lastName,
      email,
      phone,
      password,
      role: "staff",
      hospitalName,
    }),
  })
    .then((r) => r.json())
    .then((d) => {
      if (d && d.user) {
        showCustomPopup(
          "Staff Added",
          `Access code emailed to ${email}.`,
          "success"
        );
      } else {
        showCustomPopup("Error", d.message || "Failed to add staff.", "error");
      }
    })
    .catch(() => showCustomPopup("Error", "Failed to add staff.", "error"));
}

// Handle call and complete actions
document.addEventListener("click", async (e) => {
  const callBtn = e.target.closest(".call-btn");
  if (callBtn) {
    e.preventDefault();
    try {
      const response = await fetch(
        "https://qure-design.onrender.com/api/queues/call-next",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        }
      );
      const data = await response.json();
      if (response.ok) {
        showCustomPopup(
          "Patient Called",
          `Patient ${data?.data?.patientName || ""} (${
            data?.data?.queueNumber || ""
          }) has been called.`,
          "success"
        );
        await loadQueueData();
      } else {
        showCustomPopup(
          "No Patients",
          data.message || "No patients available to call.",
          "info"
        );
      }
    } catch (err) {
      showCustomPopup("Error", "Failed to call next patient.", "error");
    }
    return;
  }

  const completeBtn = e.target.closest(".complete-btn");
  if (completeBtn) {
    e.preventDefault();
    const queueId = completeBtn.getAttribute("data-id");
    try {
      const response = await fetch(
        "https://qure-design.onrender.com/api/queues/complete",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ queueId }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        showCustomPopup(
          "Marked Completed",
          `Patient ${data?.data?.patientName || ""} (${
            data?.data?.queueNumber || ""
          }) marked as done.`,
          "success"
        );
        await loadQueueData();
      } else {
        showCustomPopup(
          "Action Failed",
          data.message || "Unable to mark complete.",
          "warning"
        );
      }
    } catch (err) {
      showCustomPopup("Error", "Failed to complete patient.", "error");
    }
  }
});

// Load analytics data
async function loadAnalyticsData() {
  try {
    console.log("Loading analytics data...");

    // Get current queue data
    const user = JSON.parse(localStorage.getItem("user") || "null");
    let hospitalName =
      user?.hospitalName || localStorage.getItem("lastHospitalName") || "";

    if (!hospitalName) {
      const label = document
        .getElementById("hospitalNameLabel")
        ?.textContent?.trim();
      if (label && label.toLowerCase() !== "hospital") hospitalName = label;
    }

    const isValidHospital =
      hospitalName &&
      hospitalName.toLowerCase() !== "select hospital" &&
      hospitalName !== "Hospital";
    const url = isValidHospital
      ? `https://qure-design.onrender.com/api/queues/hospital?hospitalName=${encodeURIComponent(
          hospitalName
        )}`
      : `https://qure-design.onrender.com/api/queues/all`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      const queues = Array.isArray(data.data)
        ? data.data
        : data.data?.queues || [];

      // Update charts with real data
      updateDailyTrendsChart(queues);
      updatePeakHoursChart(queues);
      updateDepartmentHeatmap(queues);
    }
  } catch (error) {
    console.error("Error loading analytics data:", error);
  }
}

// Update Daily Trends Chart with real data
function updateDailyTrendsChart(queues) {
  if (!window.dailyChart) return;

  // Analyze queue data by day of week
  const dayStats = {
    Sunday: 0,
    Monday: 0,
    Tuesday: 0,
    Wednesday: 0,
    Thursday: 0,
    Friday: 0,
    Saturday: 0,
  };

  queues.forEach((queue) => {
    if (queue.createdAt) {
      const date = new Date(queue.createdAt);
      const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
      if (dayStats.hasOwnProperty(dayName)) {
        dayStats[dayName]++;
      }
    }
  });

  // Update chart data
  window.dailyChart.data.datasets[0].data = [
    dayStats.Sunday,
    dayStats.Monday,
    dayStats.Tuesday,
    dayStats.Wednesday,
    dayStats.Thursday,
    dayStats.Friday,
    dayStats.Saturday,
  ];

  window.dailyChart.update();
}

// Update Peak Hours Chart with real data
function updatePeakHoursChart(queues) {
  if (!window.hoursChart) return;

  // Analyze queue data by hour
  const hourStats = {
    "8AM": 0,
    "10AM": 0,
    "12PM": 0,
    "2PM": 0,
    "4PM": 0,
    "6PM": 0,
    "8PM": 0,
  };

  queues.forEach((queue) => {
    if (queue.createdAt) {
      const date = new Date(queue.createdAt);
      const hour = date.getHours();

      // Map hours to our chart labels
      if (hour >= 8 && hour < 10) hourStats["8AM"]++;
      else if (hour >= 10 && hour < 12) hourStats["10AM"]++;
      else if (hour >= 12 && hour < 14) hourStats["12PM"]++;
      else if (hour >= 14 && hour < 16) hourStats["2PM"]++;
      else if (hour >= 16 && hour < 18) hourStats["4PM"]++;
      else if (hour >= 18 && hour < 20) hourStats["6PM"]++;
      else if (hour >= 20 && hour < 22) hourStats["8PM"]++;
    }
  });

  // Update chart data
  window.hoursChart.data.datasets[0].data = [
    hourStats["8AM"],
    hourStats["10AM"],
    hourStats["12PM"],
    hourStats["2PM"],
    hourStats["4PM"],
    hourStats["6PM"],
    hourStats["8PM"],
  ];

  window.hoursChart.update();
}

// Update Department Heatmap with real data
function updateDepartmentHeatmap(queues) {
  // Analyze queue data by department
  const departmentStats = {};

  queues.forEach((queue) => {
    const dept = queue.specialty || "General";
    departmentStats[dept] = (departmentStats[dept] || 0) + 1;
  });

  // Update heatmap squares based on department activity
  const heatmapSquares = document.querySelectorAll(".heatmap .sq");
  const departments = Object.keys(departmentStats);
  const maxCount = Math.max(...Object.values(departmentStats), 1);

  heatmapSquares.forEach((square, index) => {
    const deptIndex = index % departments.length;
    const dept = departments[deptIndex];
    const count = departmentStats[dept] || 0;
    const intensity = count / maxCount;

    // Remove existing classes
    square.classList.remove("low", "medium", "high");

    // Add appropriate intensity class
    if (intensity > 0.7) {
      square.classList.add("high");
    } else if (intensity > 0.3) {
      square.classList.add("medium");
    } else {
      square.classList.add("low");
    }

    // Add tooltip with department info
    square.title = `${dept}: ${count} patients`;
  });
}

// Placeholder functions for future implementation
async function loadStaffData() {
  // TODO: Implement staff data loading
}

async function loadRoleData() {
  // TODO: Implement role data loading
}

async function loadDepartmentStatus() {
  // TODO: Implement department status loading
}

// Waiting rooms functionality moved to wait-management.html

// Logout functionality
function handleLogout() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("user");
  localStorage.removeItem("staffAccessValidated");
  localStorage.removeItem("staffAccessCode");
  window.location.href = "login.html";
}

// Show logout confirmation UI
function showLogoutConfirmation() {
  // Remove any existing popup
  const existingPopup = document.querySelector(".custom-popup");
  if (existingPopup) {
    existingPopup.remove();
  }

  // Create popup overlay
  const overlay = document.createElement("div");
  overlay.className = "custom-popup-overlay";
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    animation: fadeIn 0.3s ease;
  `;

  // Create popup content
  const popup = document.createElement("div");
  popup.className = "custom-popup";
  popup.style.cssText = `
    background: white;
    border-radius: 12px;
    padding: 32px;
    max-width: 400px;
    width: 90%;
    text-align: center;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    animation: slideIn 0.3s ease;
  `;

  popup.innerHTML = `
    <div style="margin-bottom: 24px;">
      <div style="width: 64px; height: 64px; background: #fef2f2; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16,17 21,12 16,7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
      </div>
      <h3 style="margin: 0 0 8px; font-size: 20px; font-weight: 600; color: #1f2937;">Logout Confirmation</h3>
      <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.5;">Are you sure you want to logout? You'll need to sign in again to access the dashboard.</p>
    </div>
    <div style="display: flex; gap: 12px; justify-content: center;">
      <button id="cancelLogout" style="
        padding: 10px 24px;
        border: 1px solid #d1d5db;
        background: white;
        color: #374151;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
      " onmouseover="this.style.backgroundColor='#f9fafb'" onmouseout="this.style.backgroundColor='white'">
        Cancel
      </button>
      <button id="confirmLogout" style="
        padding: 10px 24px;
        border: none;
        background: #ef4444;
        color: white;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
      " onmouseover="this.style.backgroundColor='#dc2626'" onmouseout="this.style.backgroundColor='#ef4444'">
        Logout
      </button>
    </div>
  `;

  overlay.appendChild(popup);
  document.body.appendChild(overlay);

  // Add event listeners
  document.getElementById("cancelLogout").addEventListener("click", () => {
    overlay.remove();
  });

  document.getElementById("confirmLogout").addEventListener("click", () => {
    overlay.remove();
    handleLogout();
  });

  // Close on overlay click
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      overlay.remove();
    }
  });
}

// Real-time waiting room occupancy tracking - moved to wait-management.html

// Function to update waiting room occupancy in real-time
async function updateWaitingRoomOccupancy() {
  try {
    const token = localStorage.getItem("authToken");
    if (!token) return;

    const response = await fetch(`${API_BASE_URL}/waiting-rooms`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        const newOccupancy = {};
        let hasChanges = false;

        data.data.forEach((room) => {
          newOccupancy[room._id] = {
            currentOccupancy: room.currentOccupancy,
            capacity: room.capacity,
            occupancyPercentage: room.occupancyPercentage,
            color: room.color,
            status: room.status,
          };

          // Check if occupancy changed
          if (
            !waitingRoomOccupancy[room._id] ||
            waitingRoomOccupancy[room._id].currentOccupancy !==
              room.currentOccupancy
          ) {
            hasChanges = true;
          }
        });

        // Update global occupancy state
        waitingRoomOccupancy = newOccupancy;

        // If there are changes, update the UI silently
        if (hasChanges) {
          updateWaitingRoomUI();
          // No notification - silent update
        }
      }
    }
  } catch (error) {
    console.error("Error updating waiting room occupancy:", error);
  }
}

// Function to update waiting room UI elements
function updateWaitingRoomUI() {
  // Update any waiting room displays on the page
  Object.keys(waitingRoomOccupancy).forEach((roomId) => {
    const occupancy = waitingRoomOccupancy[roomId];

    // Update room occupancy displays
    const roomElements = document.querySelectorAll(
      `[data-room-id="${roomId}"]`
    );
    roomElements.forEach((element) => {
      const occupancyElement = element.querySelector(".occupancy-count");
      const percentageElement = element.querySelector(".occupancy-percentage");
      const statusElement = element.querySelector(".room-status");

      if (occupancyElement) {
        occupancyElement.textContent = `${occupancy.currentOccupancy}/${occupancy.capacity}`;
      }

      if (percentageElement) {
        percentageElement.textContent = `${occupancy.occupancyPercentage}%`;
      }

      if (statusElement) {
        statusElement.className = `room-status status-${occupancy.color}`;
        statusElement.textContent = occupancy.status;
      }
    });
  });
}

// Function to start real-time occupancy monitoring
function startOccupancyMonitoring() {
  // Update immediately
  updateWaitingRoomOccupancy();

  // Then update every 30 seconds
  occupancyUpdateInterval = setInterval(updateWaitingRoomOccupancy, 30000);
}

// Function to stop real-time occupancy monitoring
function stopOccupancyMonitoring() {
  if (occupancyUpdateInterval) {
    clearInterval(occupancyUpdateInterval);
    occupancyUpdateInterval = null;
  }
}

// Function to handle room assignment and trigger real-time updates
async function assignPatientsToRoom(queueIds, roomId) {
  try {
    const token = localStorage.getItem("authToken");
    if (!token) {
      showCustomPopup(
        "Error",
        "Authentication required. Please log in again.",
        "error"
      );
      return;
    }

    // Check room capacity before assignment
    const roomOccupancy = waitingRoomOccupancy[roomId];
    if (roomOccupancy) {
      const availableCapacity =
        roomOccupancy.capacity - roomOccupancy.currentOccupancy;
      if (queueIds.length > availableCapacity) {
        showCustomPopup(
          "Room Full",
          `Cannot assign ${queueIds.length} patients. Room only has ${availableCapacity} available spaces.`,
          "error"
        );
        return false;
      }
    }

    const response = await fetch(`${API_BASE_URL}/queues/assign-room`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        queueIds: queueIds,
        roomId: roomId,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        showCustomPopup(
          "Success",
          `Successfully assigned ${queueIds.length} patient(s) to the waiting room.`,
          "success"
        );

        // Trigger immediate occupancy update
        setTimeout(() => {
          updateWaitingRoomOccupancy();
        }, 1000);

        return true;
      } else {
        showCustomPopup(
          "Error",
          data.message || "Failed to assign patients to room.",
          "error"
        );
        return false;
      }
    } else {
      const errorData = await response.json();
      showCustomPopup(
        "Error",
        errorData.message || "Failed to assign patients to room.",
        "error"
      );
      return false;
    }
  } catch (error) {
    console.error("Error assigning patients to room:", error);
    showCustomPopup("Error", "Network error. Please try again.", "error");
    return false;
  }
}

// Function to remove patients from room and trigger real-time updates
// Note: This function is ready for when a remove-room endpoint is added to the backend
async function removePatientsFromRoom(queueIds) {
  try {
    const token = localStorage.getItem("authToken");
    if (!token) {
      showCustomPopup(
        "Error",
        "Authentication required. Please log in again.",
        "error"
      );
      return;
    }

    // TODO: Implement remove-room endpoint in backend
    // For now, we'll show a message that this feature is coming soon
    showCustomPopup(
      "Feature Coming Soon",
      "Room removal functionality will be available in the next update.",
      "info"
    );

    // Trigger occupancy update anyway to refresh data
    setTimeout(() => {
      updateWaitingRoomOccupancy();
    }, 1000);

    return false; // Indicate that the operation was not completed
  } catch (error) {
    console.error("Error removing patients from room:", error);
    showCustomPopup("Error", "Network error. Please try again.", "error");
    return false;
  }
}

// Auto-refresh disabled for staff and role data
function setupAutoRefresh() {
  // Auto-refresh removed as requested
  console.log("Auto-refresh disabled for staff and role data");
}

// Add logout to logout link
document.addEventListener("DOMContentLoaded", () => {
  // Setup logout functionality
  const logoutLink = document.querySelector('.log-out a[href="login.html"]');
  if (logoutLink) {
    logoutLink.addEventListener("click", (e) => {
      e.preventDefault();
      showLogoutConfirmation();
    });
  }

  // Setup auto-refresh
  setupAutoRefresh();

  // Start real-time waiting room occupancy monitoring
  startOccupancyMonitoring();
});

/* ---------- DOM refs ---------- */
const wrapper = document.getElementById("dateMeter");
const button = document.querySelector(".date-btn");
const menu = document.getElementById("menu");
const label = document.getElementById("current-date");
const startEl = document.getElementById("start-date");
const endEl = document.getElementById("end-date");
const apply = document.getElementById("applyBtn");
const clear = document.getElementById("clearBtn");
const queueTableBody = document.querySelector(".queue-list tbody");
const queueLengthEl = document.getElementById("queue-length");
const noShowEl = document.getElementById("no-shows");
const callNextBtn = document.getElementById("callNextBtn");

/* ---------- Date range UI (unchanged) ---------- */
button.addEventListener("click", () => {
  const nowOpen = wrapper.classList.toggle("open");
  button.setAttribute("aria-expanded", String(nowOpen));
  if (nowOpen) requestAnimationFrame(() => adjustMenuPosition());
});
apply.addEventListener("click", () => {
  const s = startEl.value,
    e = endEl.value;
  if (!s || !e) {
    wrapper.classList.remove("open");
    button.setAttribute("aria-expanded", "false");
    return;
  }
  let sDate = new Date(s),
    eDate = new Date(e);
  if (sDate > eDate) [sDate, eDate] = [eDate, sDate];
  label.textContent = formatRange(sDate, eDate);
  wrapper.classList.remove("open");
  button.setAttribute("aria-expanded", "false");
});
clear.addEventListener("click", () => {
  startEl.value = "";
  endEl.value = "";
  startEl.focus();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    wrapper.classList.remove("open");
    button.setAttribute("aria-expanded", "false");
    button.focus();
    menu.style.left = "";
    menu.style.right = "";
    menu.style.top = "";
    menu.style.bottom = "";
  }
});
document.addEventListener("click", (e) => {
  if (!wrapper.contains(e.target)) {
    wrapper.classList.remove("open");
    button.setAttribute("aria-expanded", "false");
    menu.style.left = "";
    menu.style.right = "";
    menu.style.top = "";
    menu.style.bottom = "";
  }
});
function adjustMenuPosition() {
  menu.style.left = "0";
  menu.style.right = "";
  menu.style.top = "calc(100% + 8px)";
  menu.style.bottom = "";
  const rect = menu.getBoundingClientRect();
  if (rect.right > window.innerWidth) {
    menu.style.left = "auto";
    menu.style.right = "0";
  }
  const updated = menu.getBoundingClientRect();
  if (
    updated.bottom > window.innerHeight &&
    updated.height + 12 < wrapper.getBoundingClientRect().top
  ) {
    menu.style.top = "";
    menu.style.bottom = "calc(100% + 8px)";
  }
}
function formatRange(sDate, eDate) {
  const startStr = sDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const sameYear = sDate.getFullYear() === eDate.getFullYear();
  const endStr = eDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: sameYear ? undefined : "numeric",
  });
  return `${startStr} - ${endStr}`;
}

/* ---------- Helper: map status -> icon + color-class ---------- */
function getActionIcon(status) {
  const s = (status || "").toLowerCase().trim();
  switch (s) {
    case "called":
    case "waiting":
      return { icon: "campaign", className: "call" }; // campaign or call icon
    case "no show":
    case "no-show":
      return { icon: "error", className: "error" };
    case "in triage":
      return { icon: "local_hospital", className: "hospi-icon" };
    case "with doc":
      return { icon: "medical_services", className: "check" };
    case "completed":
    case "checked-in":
      return { icon: "check", className: "check" };
    default:
      return { icon: "mail", className: "mail" };
  }
}

/* ---------- Add event handlers for action icons ---------- */
function addActionIconHandlers() {
  // Remove existing handlers to avoid duplicates
  document
    .querySelectorAll(".call-action, .complete-action")
    .forEach((icon) => {
      icon.replaceWith(icon.cloneNode(true));
    });

  // Add call action handlers
  document.querySelectorAll(".call-action").forEach((icon) => {
    icon.addEventListener("click", (e) => {
      e.stopPropagation();
      const queueId = icon.dataset.queueId;
      const patientName = icon.dataset.patientName;
      const ticket = icon.dataset.ticket;

      console.log("Call action clicked:", { queueId, patientName, ticket });
      handleCallIndividualPatient(queueId, patientName, ticket);
    });
  });

  // Add complete action handlers
  document.querySelectorAll(".complete-action").forEach((icon) => {
    icon.addEventListener("click", (e) => {
      e.stopPropagation();
      const queueId = icon.dataset.queueId;
      const patientName = icon.dataset.patientName;
      const ticket = icon.dataset.ticket;

      console.log("Complete action clicked:", { queueId, patientName, ticket });
      handleCompleteIndividualPatient(queueId, patientName, ticket);
    });
  });
}

/* ---------- Popup System ---------- */
function showPopup(message, type = "info") {
  const popup = document.createElement("div");
  popup.className = `popup-toast popup-${type}`;

  const icons = {
    success: "fa-check-circle",
    error: "fa-exclamation-circle",
    warning: "fa-exclamation-triangle",
    info: "fa-info-circle",
  };

  popup.innerHTML = `
    <div class="popup-toast-content">
      <i class="fa-solid ${icons[type] || icons.info}"></i>
      <span>${message}</span>
    </div>
  `;

  document.body.appendChild(popup);

  // Animate in
  setTimeout(() => popup.classList.add("show"), 100);

  // Auto remove after 4 seconds
  setTimeout(() => {
    popup.classList.remove("show");
    setTimeout(() => {
      if (document.body.contains(popup)) {
        document.body.removeChild(popup);
      }
    }, 300);
  }, 4000);
}

/* ---------- Individual Patient Actions ---------- */
function handleCallIndividualPatient(queueId, patientName, ticket) {
  console.log("handleCallIndividualPatient called with:", {
    queueId,
    patientName,
    ticket,
  });

  const token = localStorage.getItem("authToken");
  if (!token) {
    showPopup("Please log in to call patient", "error");
    return;
  }

  const user = JSON.parse(localStorage.getItem("user") || "null");
  if (user?.role !== "staff") {
    showPopup("Only staff can call patients", "error");
    return;
  }

  console.log("Making API call to call-specific with queueId:", queueId);

  // Call the specific patient
  fetch("https://qure-design.onrender.com/api/queues/call-specific", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      queueId: queueId,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        showPopup(`Called ${patientName} (${ticket})`, "success");
        loadQueueData(); // Refresh the queue
      } else {
        showPopup(`Error: ${data.message}`, "error");
      }
    })
    .catch((error) => {
      console.error("Call individual patient error:", error);
      showPopup("Failed to call patient", "error");
    });
}

function handleCompleteIndividualPatient(queueId, patientName, ticket) {
  console.log("handleCompleteIndividualPatient called with:", {
    queueId,
    patientName,
    ticket,
  });

  const token = localStorage.getItem("authToken");
  if (!token) {
    showPopup("Please log in to complete patient", "error");
    return;
  }

  const user = JSON.parse(localStorage.getItem("user") || "null");
  if (user?.role !== "staff") {
    showPopup("Only staff can complete patients", "error");
    return;
  }

  console.log("Making API call to complete-specific with queueId:", queueId);

  // Complete the specific patient
  fetch("https://qure-design.onrender.com/api/queues/complete-specific", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      queueId: queueId,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        showPopup(`Completed ${patientName} (${ticket})`, "success");
        loadQueueData(); // Refresh the queue
      } else {
        showPopup(`Error: ${data.message}`, "error");
      }
    })
    .catch((error) => {
      console.error("Complete individual patient error:", error);
      showPopup("Failed to complete patient", "error");
    });
}

/* ---------- Utility: find column indexes by header label ---------- */
function getColumnIndexes() {
  const headers = Array.from(document.querySelectorAll(".queue-list thead th"));
  const indexes = {
    department: -1,
    status: -1,
    wait: -1,
    action: -1,
  };
  headers.forEach((th, i) => {
    const t = th.textContent.trim().toLowerCase();
    if (t.includes("department")) indexes.department = i;
    if (t.includes("status")) indexes.status = i;
    if (t.includes("waiting")) indexes.wait = i;
    if (t.includes("action")) indexes.action = i;
  });
  return indexes;
}
let colIdx = getColumnIndexes();

/* ---------- Ensure header department dropdown has an "All" option ---------- */
function ensureHeaderAllOption() {
  const headerUl = document.querySelector(
    ".department-dropdown .dropdown-content"
  );
  if (!headerUl) return;
  const hasAll = Array.from(headerUl.querySelectorAll("li")).some(
    (li) => li.textContent.trim().toLowerCase() === "all"
  );
  if (!hasAll) {
    const allLi = document.createElement("li");
    allLi.textContent = "All";
    headerUl.insertBefore(allLi, headerUl.firstChild);
  }
}
ensureHeaderAllOption();

/* ---------- Filter rows by department (header filter) ---------- */
let currentDeptFilter = null;
function filterRowsByDepartment(selected) {
  selected = (selected || "").trim();
  currentDeptFilter = selected.toLowerCase() === "all" ? null : selected;
  const rows = Array.from(queueTableBody.querySelectorAll("tr"));
  rows.forEach((r) => {
    const deptCell = r.cells[colIdx.department];
    const deptText = (deptCell ? deptCell.textContent : "").trim();
    if (!currentDeptFilter) {
      r.style.display = ""; // show all
    } else {
      r.style.display =
        deptText.toLowerCase() === currentDeptFilter.toLowerCase()
          ? ""
          : "none";
    }
  });
  updateStats();
}

/* ---------- addQueueRow (use header department list for random picks) ---------- */
function addQueueRow(name, ticket, department, status, wait) {
  // create row with 6 columns to match your table (Name, Ticket, Dept, Status, Wait, Action)
  const action = getActionIcon(status);
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>${name}</td>
    <td>${ticket}</td>
    <td>${department}</td>
    <td>${status}</td>
    <td>${wait}</td>
    <td><span class="material-symbols-outlined ${action.className}">${action.icon}</span></td>
  `;
  queueTableBody.appendChild(tr);

  // re-apply header filter (if any) so newly added rows obey current filter
  if (currentDeptFilter) filterRowsByDepartment(currentDeptFilter);
  updateStats();
}

/* ---------- Stats (counts use VISIBLE rows only) ---------- */
function updateStats() {
  const rows = Array.from(queueTableBody.querySelectorAll("tr"));
  let totalWait = 0;
  let visibleCount = 0;
  let noShows = 0;

  rows.forEach((row) => {
    if (row.style.display === "none") return; // skip hidden rows
    visibleCount++;
    const status = (row.cells[colIdx.status]?.textContent || "")
      .trim()
      .toLowerCase();
    const waitText = (row.cells[colIdx.wait]?.textContent || "").trim();
    const waitMins = parseInt(waitText, 10) || 0;
    totalWait += waitMins;
    if (status === "no show" || status === "no-show") noShows++;
  });

  queueLengthEl.textContent = visibleCount;
  noShowEl.textContent = noShows;
  const avg = visibleCount > 0 ? Math.round(totalWait / visibleCount) : 0;
  document.getElementById("avg-wait").textContent = avg + " mins";
}

/* ---------- Get department options from the table header (exclude 'All') ---------- */
function getHeaderDeptOptions() {
  const lis = Array.from(
    document.querySelectorAll(".department-dropdown .dropdown-content li")
  );
  return lis
    .map((li) => li.textContent.trim())
    .filter((t) => t && t.toLowerCase() !== "all");
}

/* ---------- Event delegation for dropdown toggles and list items ---------- */
document.addEventListener("click", (e) => {
  // --- handle toggle clicks (open/close) ---
  const toggle = e.target.closest(".dropdown-toggle");
  if (toggle) {
    e.stopPropagation();
    const dropdown = toggle.closest(".dropdown");
    const content = dropdown.querySelector(".dropdown-content");
    // close other dropdowns
    document.querySelectorAll(".dropdown").forEach((d) => {
      if (d !== dropdown) {
        d.classList.remove("open");
        const c = d.querySelector(".dropdown-content");
        if (c) c.style.display = "none";
      }
    });
    // toggle current
    if (!content) return;
    if (content.style.display === "block") {
      content.style.display = "none";
      dropdown.classList.remove("open");
    } else {
      content.style.display = "block";
      dropdown.classList.add("open");
    }
    return;
  }

  // --- handle li selection inside any dropdown ---
  const li = e.target.closest(".dropdown-content li");
  if (li) {
    e.stopPropagation();
    const dropdown = li.closest(".dropdown");
    const btn = dropdown.querySelector(
      ".btn, .btns, .dept-btn, .select-btn, .hosp-btn"
    );
    if (btn) btn.textContent = li.textContent;

    // close the dropdown
    const content = dropdown.querySelector(".dropdown-content");
    if (content) content.style.display = "none";
    dropdown.classList.remove("open");

    // If this was the header department dropdown -> filter table
    if (
      dropdown.classList.contains("department-dropdown") ||
      dropdown.classList.contains("dept-dropdown")
    ) {
      filterRowsByDepartment(li.textContent.trim());
      return;
    }

    // If the li was inside a dropdown that sits inside a table row, update that row's relevant cell
    const row = li.closest("tr");
    if (row) {
      // find which column this dropdown sits in by walking up to the td
      const td = li.closest("td");
      if (!td) return;
      const cellIndex = Array.from(td.parentElement.children).indexOf(td);

      // If clicked dropdown is inside the department column, update department text
      if (cellIndex === colIdx.department) {
        row.cells[colIdx.department].textContent = li.textContent.trim();
        // Apply header filter if any
        if (currentDeptFilter) filterRowsByDepartment(currentDeptFilter);
        updateStats();
        return;
      }

      // If clicked dropdown relates to status column, update status + action icon
      if (cellIndex === colIdx.status) {
        row.cells[colIdx.status].textContent = li.textContent.trim();
        // update action icon in the action cell
        const newAction = getActionIcon(li.textContent.trim());
        const actionCell = row.cells[colIdx.action];
        if (actionCell) {
          actionCell.innerHTML = `<span class="material-symbols-outlined ${newAction.className}">${newAction.icon}</span>`;
        }
        updateStats();
        return;
      }
    }
  }

  // close any open dropdown if clicked outside
  document.querySelectorAll(".dropdown").forEach((d) => {
    d.classList.remove("open");
    const c = d.querySelector(".dropdown-content");
    if (c) c.style.display = "none";
  });
});

/* ---------- Call Next: call next patient in queue ---------- */
callNextBtn.addEventListener("click", async () => {
  try {
    const response = await fetch(
      "https://qure-design.onrender.com/api/queues/call-next",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      showCustomPopup(
        "Patient Called",
        `Patient ${data.patientName} (${data.queueNumber}) has been called.`,
        "success"
      );

      // Refresh queue data
      await loadQueueData();
    } else {
      const errorData = await response.json();
      showCustomPopup(
        "No Patients",
        errorData.message || "No patients available to call.",
        "info"
      );
    }
  } catch (error) {
    console.error("Error calling next patient:", error);
    showCustomPopup(
      "Error",
      "Failed to call next patient. Please try again.",
      "error"
    );
  }
});

/* ---------- Initialize: compute indexes and update stats ---------- */
colIdx = getColumnIndexes();
updateStats();

/* ---------- Charts initialization (unchanged) ---------- */
/* paste your existing Chart.js initialization below — left as-is in your file */

// chart
// Daily Trends Chart
const dailyCtx = document.getElementById("dailyChart");
window.dailyChart = new Chart(dailyCtx, {
  type: "line",
  data: {
    labels: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    datasets: [
      {
        label: "Queue Entries",
        data: [0, 0, 0, 0, 0, 0, 0],
        borderColor: "#2563eb",
        backgroundColor: "rgba(37, 99, 235, 0.2)",
        tension: 0.4,
        fill: true,
        borderWidth: 2,
        pointBackgroundColor: "#2563eb",
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: {
          color: "#374151",
          font: { size: 14 },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: "#6b7280" },
        grid: { color: "#e5e7eb" },
      },
      y: {
        ticks: { color: "#6b7280" },
        grid: { color: "#e5e7eb" },
      },
    },
  },
});

// Peak Hours Chart
const hoursCtx = document.getElementById("hoursChart");
window.hoursChart = new Chart(hoursCtx, {
  type: "bar",
  data: {
    labels: ["8AM", "10AM", "12PM", "2PM", "4PM", "6PM", "8PM"],
    datasets: [
      {
        label: "Queue Entries",
        data: [0, 0, 0, 0, 0, 0, 0],
        backgroundColor: "rgba(16, 185, 129, 0.7)",
        borderColor: "#10b981",
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        ticks: { color: "#6b7280" },
        grid: { color: "#f3f4f6" },
      },
      y: {
        ticks: { color: "#6b7280" },
        grid: { color: "#f3f4f6" },
      },
    },
  },
});
