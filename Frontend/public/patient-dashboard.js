"use strict";

// API Configuration - Production
const API_BASE_URL = "https://qure-design.onrender.com/api";

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
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: getAuthHeaders(),
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}`);
    }

    return data;
  } catch (error) {
    throw error;
  }
};

// Notification System Functions
const formatTimeAgo = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) {
    return "Just now";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }
};

const getNotificationIcon = (type) => {
  const icons = {
    queue_update: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    appointment_reminder: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" stroke-width="2"/>
      <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" stroke-width="2"/>
      <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" stroke-width="2"/>
      <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" stroke-width="2"/>
    </svg>`,
    appointment_confirmed: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    appointment_cancelled: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
      <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" stroke-width="2"/>
      <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="2"/>
    </svg>`,
    general: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  };
  return icons[type] || icons.general;
};

const createNotificationElement = (notification) => {
  const notificationElement = document.createElement("div");
  notificationElement.className = `notification-item ${
    notification.isRead ? "read" : "unread"
  }`;
  notificationElement.setAttribute("data-notification-id", notification._id);

  notificationElement.innerHTML = `
    <div class="notification-dot"></div>
    <div class="notification-content">
      <div class="notification-title">${notification.title}</div>
      <div class="notification-message">${notification.message}</div>
      <div class="notification-meta">
        <span class="notification-time">${formatTimeAgo(
          notification.createdAt
        )}</span>
        <span class="notification-type">${notification.type.replace(
          "_",
          " "
        )}</span>
        <span class="notification-priority ${notification.priority}">${
    notification.priority
  }</span>
      </div>
    </div>
    <div class="notification-actions-item">
      ${
        !notification.isRead
          ? `
        <button class="notification-action-item-btn mark-read-btn" title="Mark as read">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      `
          : ""
      }
      <button class="notification-action-item-btn delete-btn" title="Delete notification">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <polyline points="3,6 5,6 21,6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
  `;

  // Add click event to mark as read
  const markReadBtn = notificationElement.querySelector(".mark-read-btn");
  if (markReadBtn) {
    markReadBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      markNotificationAsRead(notification._id);
    });
  }

  // Add click event to delete
  const deleteBtn = notificationElement.querySelector(".delete-btn");
  deleteBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    deleteNotification(notification._id);
  });

  // Add click event to mark as read when clicking the notification
  notificationElement.addEventListener("click", () => {
    if (!notification.isRead) {
      markNotificationAsRead(notification._id);
    }
  });

  return notificationElement;
};

const loadNotifications = async () => {
  const loadingElement = document.getElementById("notification-loading");
  const emptyElement = document.getElementById("notification-empty");
  const listElement = document.getElementById("notifications-list");

  try {
    // Show loading state
    loadingElement.style.display = "flex";
    emptyElement.style.display = "none";
    listElement.innerHTML = "";

    // Fetch notifications
    const response = await makeApiCall("/notifications?limit=10");

    if (response.success && response.data.notifications.length > 0) {
      // Hide loading and empty states
      loadingElement.style.display = "none";
      emptyElement.style.display = "none";

      // Render notifications
      response.data.notifications.forEach((notification) => {
        const notificationElement = createNotificationElement(notification);
        listElement.appendChild(notificationElement);
      });
    } else {
      // Show empty state
      loadingElement.style.display = "none";
      emptyElement.style.display = "flex";
    }
  } catch (error) {
    console.error("Error loading notifications:", error);
    loadingElement.style.display = "none";
    emptyElement.style.display = "flex";
    showCustomPopup("Error", "Failed to load notifications", "error");
  }
};

const markNotificationAsRead = async (notificationId) => {
  try {
    await makeApiCall(`/notifications/${notificationId}/read`, {
      method: "PUT",
    });

    // Update UI
    const notificationElement = document.querySelector(
      `[data-notification-id="${notificationId}"]`
    );
    if (notificationElement) {
      notificationElement.classList.remove("unread");
      notificationElement.classList.add("read");

      // Remove mark as read button
      const markReadBtn = notificationElement.querySelector(".mark-read-btn");
      if (markReadBtn) {
        markReadBtn.remove();
      }
    }
  } catch (error) {
    console.error("Error marking notification as read:", error);
    showCustomPopup("Error", "Failed to mark notification as read", "error");
  }
};

const markAllNotificationsAsRead = async () => {
  try {
    await makeApiCall("/notifications/read-all", {
      method: "PUT",
    });

    // Update UI
    const notificationElements = document.querySelectorAll(
      ".notification-item.unread"
    );
    notificationElements.forEach((element) => {
      element.classList.remove("unread");
      element.classList.add("read");

      // Remove mark as read buttons
      const markReadBtn = element.querySelector(".mark-read-btn");
      if (markReadBtn) {
        markReadBtn.remove();
      }
    });

    showCustomPopup("Success", "All notifications marked as read", "success");
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    showCustomPopup(
      "Error",
      "Failed to mark all notifications as read",
      "error"
    );
  }
};

const deleteNotification = async (notificationId) => {
  try {
    await makeApiCall(`/notifications/${notificationId}`, {
      method: "DELETE",
    });

    // Remove from UI
    const notificationElement = document.querySelector(
      `[data-notification-id="${notificationId}"]`
    );
    if (notificationElement) {
      notificationElement.remove();
    }

    // Check if list is empty
    const listElement = document.getElementById("notifications-list");
    if (listElement.children.length === 0) {
      document.getElementById("notification-empty").style.display = "flex";
    }
  } catch (error) {
    console.error("Error deleting notification:", error);
    showCustomPopup("Error", "Failed to delete notification", "error");
  }
};

const attachNotificationEventListeners = () => {
  // Create sample notifications button (for testing)
  const createSampleBtn = document.getElementById(
    "create-sample-notifications-btn"
  );
  if (createSampleBtn) {
    createSampleBtn.addEventListener("click", createSampleNotifications);
  }

  // Mark all as read button
  const markAllReadBtn = document.getElementById("mark-all-read-btn");
  if (markAllReadBtn) {
    markAllReadBtn.addEventListener("click", markAllNotificationsAsRead);
  }

  // Refresh notifications button
  const refreshBtn = document.getElementById("refresh-notifications-btn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", loadNotifications);
  }
};

// Function to create sample notifications for testing
const createSampleNotifications = async () => {
  const sampleNotifications = [
    {
      title: "Appointment Confirmed",
      message:
        "Your appointment with Dr. Smith for Dermatology has been confirmed for tomorrow at 2:00 PM.",
      type: "appointment_confirmed",
      priority: "medium",
    },
    {
      title: "Queue Update",
      message:
        "You are now position #3 in the queue. Estimated wait time: 15 minutes.",
      type: "queue_update",
      priority: "high",
    },
    {
      title: "Appointment Reminder",
      message:
        "Don't forget! You have an appointment tomorrow at 10:00 AM with Dr. Johnson.",
      type: "appointment_reminder",
      priority: "medium",
    },
    {
      title: "Welcome to Qure!",
      message:
        "Thank you for joining Qure. We're here to make your healthcare experience seamless.",
      type: "general",
      priority: "low",
    },
  ];

  try {
    for (const notification of sampleNotifications) {
      await makeApiCall("/notifications", {
        method: "POST",
        body: JSON.stringify(notification),
      });
    }
    // Reload notifications to show the new ones
    await loadNotifications();
  } catch (error) {
    console.error("Error creating sample notifications:", error);
  }
};

// Enhanced Custom Popup Function
function showCustomPopup(title, message, type = "info", options = {}) {
  // Remove any existing popup
  const existingPopup = document.querySelector(".custom-popup-overlay");
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
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(8px);
    animation: fadeIn 0.3s ease;
  `;

  // Create popup content
  const popup = document.createElement("div");
  popup.className = "custom-popup";

  // Set colors based on type
  let iconColor, bgColor, borderColor, buttonColor;
  let iconSvg = "";

  switch (type) {
    case "success":
      iconColor = "#10b981";
      bgColor = "#f0fdf4";
      borderColor = "#10b981";
      buttonColor = "#10b981";
      iconSvg = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
      </svg>`;
      break;
    case "error":
      iconColor = "#ef4444";
      bgColor = "#fef2f2";
      borderColor = "#ef4444";
      buttonColor = "#ef4444";
      iconSvg = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
        <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" stroke-width="2"/>
        <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="2"/>
      </svg>`;
      break;
    case "warning":
      iconColor = "#f59e0b";
      bgColor = "#fefbf3";
      borderColor = "#f59e0b";
      buttonColor = "#f59e0b";
      iconSvg = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
      break;
    default:
      iconColor = "#3b82f6";
      bgColor = "#f0f9ff";
      borderColor = "#3b82f6";
      buttonColor = "#3b82f6";
      iconSvg = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
        <line x1="12" y1="16" x2="12" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="12" y1="8" x2="12.01" y2="8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
  }

  popup.style.cssText = `
    background: white;
    border-radius: 16px;
    padding: 2.5rem;
    max-width: 450px;
    width: 90%;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    border: 1px solid ${borderColor};
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 1.5rem;
    animation: slideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  `;

  // Create icon
  const icon = document.createElement("div");
  icon.innerHTML = iconSvg;
  icon.style.cssText = `
    width: 64px;
    height: 64px;
    color: ${iconColor};
    background: ${bgColor};
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border: 3px solid ${borderColor};
  `;

  // Create title
  const titleEl = document.createElement("h3");
  titleEl.textContent = title;
  titleEl.style.cssText = `
    margin: 0;
    font-size: 1.75rem;
    font-weight: 700;
    color: #1f2937;
    font-family: 'Plus Jakarta Sans', sans-serif;
    line-height: 1.2;
  `;

  // Create message
  const messageEl = document.createElement("p");
  messageEl.textContent = message;
  messageEl.style.cssText = `
    margin: 0;
    font-size: 1.1rem;
    color: #6b7280;
    line-height: 1.6;
    font-family: 'Plus Jakarta Sans', sans-serif;
    max-width: 350px;
  `;

  // Create close button
  const closeBtn = document.createElement("button");
  closeBtn.textContent = options.buttonText || "Got it";
  closeBtn.style.cssText = `
    background: linear-gradient(135deg, ${buttonColor}, ${buttonColor}dd);
    color: white;
    border: none;
    border-radius: 12px;
    padding: 1rem 2.5rem;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    font-family: 'Plus Jakarta Sans', sans-serif;
    margin-top: 0.5rem;
    box-shadow: 0 4px 14px 0 rgba(0, 0, 0, 0.1);
    position: relative;
    overflow: hidden;
  `;

  // Add hover effects
  closeBtn.addEventListener("mouseenter", () => {
    closeBtn.style.transform = "translateY(-2px)";
    closeBtn.style.boxShadow = "0 8px 25px 0 rgba(0, 0, 0, 0.2)";
  });

  closeBtn.addEventListener("mouseleave", () => {
    closeBtn.style.transform = "translateY(0)";
    closeBtn.style.boxShadow = "0 4px 14px 0 rgba(0, 0, 0, 0.1)";
  });

  closeBtn.addEventListener("click", () => {
    overlay.style.animation = "fadeOut 0.3s ease";
    popup.style.animation = "slideOut 0.3s ease";
    setTimeout(() => {
      overlay.remove();
      if (options.onClose) options.onClose();
    }, 300);
  });

  // Close on overlay click
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      overlay.style.animation = "fadeOut 0.3s ease";
      popup.style.animation = "slideOut 0.3s ease";
      setTimeout(() => {
        overlay.remove();
        if (options.onClose) options.onClose();
      }, 300);
    }
  });

  // Assemble popup
  popup.appendChild(icon);
  popup.appendChild(titleEl);
  popup.appendChild(messageEl);
  popup.appendChild(closeBtn);
  overlay.appendChild(popup);

  // Add to document
  document.body.appendChild(overlay);

  // Auto-close after specified time (default 5 seconds for success)
  const autoCloseTime = options.autoClose || (type === "success" ? 5000 : null);
  if (autoCloseTime) {
    setTimeout(() => {
      if (document.body.contains(overlay)) {
        overlay.style.animation = "fadeOut 0.3s ease";
        popup.style.animation = "slideOut 0.3s ease";
        setTimeout(() => {
          overlay.remove();
          if (options.onClose) options.onClose();
        }, 300);
      }
    }, autoCloseTime);
  }
}

// Beautiful Confirmation Dialog
function showConfirmDialog(title, message, options = {}) {
  return new Promise((resolve) => {
    // Remove any existing popup
    const existingPopup = document.querySelector(".custom-popup-overlay");
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
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(8px);
      animation: fadeIn 0.3s ease;
    `;

    // Create popup content
    const popup = document.createElement("div");
    popup.style.cssText = `
      background: white;
      border-radius: 16px;
      padding: 2.5rem;
      max-width: 450px;
      width: 90%;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      border: 1px solid #e5e7eb;
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 1.5rem;
      animation: slideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    `;

    // Create warning icon
    const icon = document.createElement("div");
    icon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <line x1="12" y1="9" x2="12" y2="13" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <line x1="12" y1="17" x2="12.01" y2="17" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
    icon.style.cssText = `
      width: 64px;
      height: 64px;
      color: #f59e0b;
      background: #fefbf3;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      border: 3px solid #f59e0b;
    `;

    // Create title
    const titleEl = document.createElement("h3");
    titleEl.textContent = title;
    titleEl.style.cssText = `
      margin: 0;
      font-size: 1.75rem;
      font-weight: 700;
      color: #1f2937;
      font-family: 'Plus Jakarta Sans', sans-serif;
      line-height: 1.2;
    `;

    // Create message
    const messageEl = document.createElement("p");
    messageEl.textContent = message;
    messageEl.style.cssText = `
      margin: 0;
      font-size: 1.1rem;
      color: #6b7280;
      line-height: 1.6;
      font-family: 'Plus Jakarta Sans', sans-serif;
      max-width: 350px;
    `;

    // Create button container
    const buttonContainer = document.createElement("div");
    buttonContainer.style.cssText = `
      display: flex;
      gap: 1rem;
      margin-top: 0.5rem;
    `;

    // Create cancel button
    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = options.cancelText || "Cancel";
    cancelBtn.style.cssText = `
      background: #f3f4f6;
      color: #374151;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      padding: 1rem 2rem;
      font-size: 1.1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      font-family: 'Plus Jakarta Sans', sans-serif;
      min-width: 120px;
    `;

    // Create confirm button
    const confirmBtn = document.createElement("button");
    confirmBtn.textContent = options.confirmText || "Confirm";
    confirmBtn.style.cssText = `
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: white;
      border: none;
      border-radius: 12px;
      padding: 1rem 2rem;
      font-size: 1.1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      font-family: 'Plus Jakarta Sans', sans-serif;
      min-width: 120px;
      box-shadow: 0 4px 14px 0 rgba(239, 68, 68, 0.3);
    `;

    // Add hover effects
    cancelBtn.addEventListener("mouseenter", () => {
      cancelBtn.style.background = "#e5e7eb";
      cancelBtn.style.transform = "translateY(-1px)";
    });

    cancelBtn.addEventListener("mouseleave", () => {
      cancelBtn.style.background = "#f3f4f6";
      cancelBtn.style.transform = "translateY(0)";
    });

    confirmBtn.addEventListener("mouseenter", () => {
      confirmBtn.style.transform = "translateY(-2px)";
      confirmBtn.style.boxShadow = "0 8px 25px 0 rgba(239, 68, 68, 0.4)";
    });

    confirmBtn.addEventListener("mouseleave", () => {
      confirmBtn.style.transform = "translateY(0)";
      confirmBtn.style.boxShadow = "0 4px 14px 0 rgba(239, 68, 68, 0.3)";
    });

    // Button click handlers
    const closeDialog = (result) => {
      overlay.style.animation = "fadeOut 0.3s ease";
      popup.style.animation = "slideOut 0.3s ease";
      setTimeout(() => {
        overlay.remove();
        resolve(result);
      }, 300);
    };

    cancelBtn.addEventListener("click", () => closeDialog(false));
    confirmBtn.addEventListener("click", () => closeDialog(true));

    // Close on overlay click
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        closeDialog(false);
      }
    });

    // Assemble popup
    buttonContainer.appendChild(cancelBtn);
    buttonContainer.appendChild(confirmBtn);
    popup.appendChild(icon);
    popup.appendChild(titleEl);
    popup.appendChild(messageEl);
    popup.appendChild(buttonContainer);
    overlay.appendChild(popup);

    // Add to document
    document.body.appendChild(overlay);
  });
}

// DOM Elements
const mobileMenuToggle = document.getElementById("mobile-menu-toggle");
const mobileNavigation = document.getElementById("mobile-navigation");
const mobileCloseButton = document.getElementById("mobile-close-button");
const viewQueueBtn = document.getElementById("view-queue-btn");
const cancelQueueBtn = document.getElementById("cancel-queue-btn");
const joinQueueBtn = document.getElementById("join-queue-btn");
const bookAppointmentBtn = document.getElementById("book-appointment-btn");

// Mobile Navigation Toggle
const toggleMobileMenu = () => {
  mobileNavigation.classList.toggle("active");
  document.body.style.overflow = mobileNavigation.classList.contains("active")
    ? "hidden"
    : "auto";
};

const closeMobileMenu = () => {
  mobileNavigation.classList.remove("active");
  document.body.style.overflow = "auto";
};

// Event Listeners for Mobile Navigation
mobileMenuToggle.addEventListener("click", toggleMobileMenu);
mobileCloseButton.addEventListener("click", closeMobileMenu);

// Close mobile menu when clicking on navigation links
document.querySelectorAll(".mobile-nav-link").forEach((link) => {
  link.addEventListener("click", closeMobileMenu);
});

// Close mobile menu when clicking outside
document.addEventListener("click", (e) => {
  if (
    !mobileNavigation.contains(e.target) &&
    !mobileMenuToggle.contains(e.target)
  ) {
    closeMobileMenu();
  }
});

// Queue Management Functions
const handleViewQueue = () => {
  // Check authentication before redirect
  const token = localStorage.getItem("authToken");
  const userData = localStorage.getItem("user");

  if (!token) {
    console.log(
      "❌ No authentication token found before redirect, staying on dashboard"
    );
    showCustomPopup(
      "Authentication Error",
      "Please log in again to view your queue status.",
      "error"
    );
    return;
  }

  // If user data is missing but token exists, we can still proceed
  // The queue tracking page will handle the authentication
  if (!userData) {
    console.log(
      "⚠️ User data missing but token exists, proceeding with redirect"
    );
    console.log(
      "✅ Authentication check passed (token only), redirecting to queue tracking"
    );
    window.location.href = "real-time-queue-tracking.html";
    return;
  }

  try {
    const user = JSON.parse(userData);
    if (user.role !== "patient") {
      console.log("❌ User is not a patient before redirect");
      showCustomPopup(
        "Access Denied",
        "Only patients can view queue status.",
        "error"
      );
      return;
    }
  } catch (error) {
    console.error("❌ Error parsing user data before redirect:", error);
    console.log(
      "⚠️ User data parsing failed but token exists, proceeding with redirect"
    );
    console.log(
      "✅ Authentication check passed (token only), redirecting to queue tracking"
    );
    window.location.href = "real-time-queue-tracking.html";
    return;
  }

  console.log("✅ Authentication check passed, redirecting to queue tracking");
  // Redirect to the real-time queue tracking page
  window.location.href = "real-time-queue-tracking.html";
};

const handleCancelQueue = async () => {
  try {
    const removeLoading = addLoadingState(cancelQueueBtn);

    await makeApiCall("/queues/leave", {
      method: "DELETE",
    });

    removeLoading();
    showCustomPopup(
      "Queue Cancelled",
      "You have successfully left the queue.",
      "success"
    );

    // Refresh queue status
    await loadQueueStatus();
  } catch (error) {
    const removeLoading = addLoadingState(cancelQueueBtn);
    removeLoading();
    showCustomPopup(
      "Error",
      handleApiError(error, "Failed to leave queue. Please try again."),
      "error"
    );
  }
};

const handleJoinQueue = async () => {
  // Show queue selection modal
  showQueueSelectionModal();
};

// Queue Selection Modal
const showQueueSelectionModal = () => {
  // Remove any existing modal
  const existingModal = document.querySelector(".queue-selection-modal");
  if (existingModal) {
    existingModal.remove();
  }

  // Create modal overlay
  const overlay = document.createElement("div");
  overlay.className = "queue-selection-modal";
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

  // Create modal content
  const modal = document.createElement("div");
  modal.style.cssText = `
    background: white;
    border-radius: 12px;
    padding: 2rem;
    max-width: 500px;
    width: 90%;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    animation: slideIn 0.3s ease;
  `;

  modal.innerHTML = `
    <h3 style="margin: 0 0 1.5rem 0; color: #1f2937; text-align: center;">Join Queue</h3>
    
    <div style="margin-bottom: 1rem;">
      <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #374151;">Hospital/Clinic Name</label>
      <input type="text" id="hospital-name" placeholder="Enter hospital/clinic name" 
             style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 8px; font-size: 1rem;">
    </div>
    
    <div style="margin-bottom: 1.5rem;">
      <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #374151;">Specialty</label>
      <select id="specialty" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 8px; font-size: 1rem;">
        <option value="">Select specialty</option>
        <option value="General Medicine">General Medicine</option>
        <option value="Cardiology">Cardiology</option>
        <option value="Dermatology">Dermatology</option>
        <option value="Pediatrics">Pediatrics</option>
        <option value="Orthopedics">Orthopedics</option>
        <option value="Gynecology">Gynecology</option>
        <option value="Neurology">Neurology</option>
        <option value="Emergency">Emergency</option>
      </select>
    </div>
    
    <div style="margin-bottom: 1.5rem;">
      <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #374151;">Notes (Optional)</label>
      <textarea id="queue-notes" placeholder="Any additional information..." 
                style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 8px; font-size: 1rem; min-height: 80px; resize: vertical;"></textarea>
    </div>
    
    <div style="display: flex; gap: 1rem; justify-content: flex-end;">
      <button id="cancel-join-queue" style="padding: 0.75rem 1.5rem; border: 1px solid #d1d5db; background: white; border-radius: 8px; cursor: pointer; font-weight: 500;">Cancel</button>
      <button id="confirm-join-queue" style="padding: 0.75rem 1.5rem; background: #1e3a8a; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">Join Queue</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Add event listeners
  document.getElementById("cancel-join-queue").addEventListener("click", () => {
    overlay.remove();
  });

  document
    .getElementById("confirm-join-queue")
    .addEventListener("click", async () => {
      const hospitalName = document
        .getElementById("hospital-name")
        .value.trim();
      const specialty = document.getElementById("specialty").value;
      const notes = document.getElementById("queue-notes").value.trim();

      if (!hospitalName || !specialty) {
        showCustomPopup(
          "Validation Error",
          "Please fill in all required fields.",
          "error"
        );
        return;
      }

      try {
        const joinBtn = document.getElementById("confirm-join-queue");
        const originalText = joinBtn.textContent;
        joinBtn.disabled = true;
        joinBtn.textContent = "Joining...";

        await makeApiCall("/queues/join", {
          method: "POST",
          body: JSON.stringify({
            hospitalName,
            specialty,
            notes: notes || undefined,
            priority: "medium",
          }),
        });

        overlay.remove();
        showCustomPopup(
          "Queue Joined",
          `You have successfully joined the ${specialty} queue at ${hospitalName}.`,
          "success"
        );

        // Refresh queue status
        await loadQueueStatus();
      } catch (error) {
        const joinBtn = document.getElementById("confirm-join-queue");
        joinBtn.disabled = false;
        joinBtn.textContent = "Join Queue";

        // Check if user is already in a queue
        if (error.message && error.message.includes("already in a queue")) {
          showCustomPopup(
            "Already in Queue",
            "You are already in a queue. Please wait for your turn or leave the current queue before joining another one.",
            "warning"
          );
        } else {
          showCustomPopup(
            "Error",
            handleApiError(error, "Failed to join queue. Please try again."),
            "error"
          );
        }
      }
    });

  // Close on overlay click
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      overlay.remove();
    }
  });
};

const handleBookAppointment = () => {
  // Redirect to the Book Appointment page
  window.location.href = "book-appointment.html";
};

// Load queue status from API
const loadQueueStatus = async () => {
  try {
    const response = await makeApiCall("/queues/status");

    if (response.success && response.data) {
      const queueData = response.data;
      updateQueueStatusDisplay(queueData);
    } else {
      // No active queue
      hideQueueStatusDisplay();
    }
  } catch (error) {
    // User not in queue or error
    hideQueueStatusDisplay();
  }
};

// Update queue status display
const updateQueueStatusDisplay = (queueData) => {
  const queueCard = document.querySelector(".queue-status-card");
  if (!queueCard) return;

  const queueNumber = queueCard.querySelector(".queue-number");
  const queueEta = queueCard.querySelector(".queue-eta");
  const queueTitle = queueCard.querySelector(".queue-title");

  if (queueNumber) queueNumber.textContent = queueData.queueNumber;
  if (queueEta)
    queueEta.textContent = `ETA: ${
      queueData.queueStats?.estimatedWaitTime || 0
    } mins`;
  if (queueTitle) queueTitle.textContent = "You are in a queue";

  // Show the queue card
  queueCard.style.display = "block";

  // Hide the "Join Queue" button since user is already in a queue
  if (joinQueueBtn) {
    joinQueueBtn.style.display = "none";
  }
};

// Hide queue status display
const hideQueueStatusDisplay = () => {
  const queueCard = document.querySelector(".queue-status-card");
  if (queueCard) {
    queueCard.style.display = "none";
  }

  // Show the "Join Queue" button since user is not in a queue
  if (joinQueueBtn) {
    joinQueueBtn.style.display = "block";
  }
};

// Event Listeners for Action Buttons
viewQueueBtn.addEventListener("click", handleViewQueue);
cancelQueueBtn.addEventListener("click", handleCancelQueue);
joinQueueBtn.addEventListener("click", handleJoinQueue);
bookAppointmentBtn.addEventListener("click", handleBookAppointment);

// Appointment Management Functions
const handleReschedule = async (appointmentCard) => {
  const appointmentId = appointmentCard.dataset.appointmentId;
  if (!appointmentId) {
    showCustomPopup("Error", "Appointment ID not found.", "error");
    return;
  }

  // Show reschedule modal
  showRescheduleModal(appointmentId);
};

const handleCancelAppointment = async (appointmentCard) => {
  const appointmentId = appointmentCard.dataset.appointmentId;
  if (!appointmentId) {
    showCustomPopup("Error", "Appointment ID not found.", "error");
    return;
  }

  // Show beautiful confirmation dialog
  const confirmCancel = await showConfirmDialog(
    "Cancel Appointment",
    "Are you sure you want to cancel this appointment? This action cannot be undone.",
    {
      confirmText: "Yes, Cancel",
      cancelText: "Keep Appointment",
    }
  );
  if (!confirmCancel) return;

  try {
    await makeApiCall(`/appointments/${appointmentId}`, {
      method: "DELETE",
    });

    showCustomPopup(
      "Appointment Cancelled",
      "Your appointment has been cancelled successfully.",
      "success"
    );

    // Refresh appointments
    await loadAppointments();
  } catch (error) {
    showCustomPopup(
      "Error",
      handleApiError(error, "Failed to cancel appointment. Please try again."),
      "error"
    );
  }
};

// Reschedule Modal
const showRescheduleModal = (appointmentId) => {
  // Remove any existing modal
  const existingModal = document.querySelector(".reschedule-modal");
  if (existingModal) {
    existingModal.remove();
  }

  // Create modal overlay
  const overlay = document.createElement("div");
  overlay.className = "reschedule-modal";
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

  // Create modal content
  const modal = document.createElement("div");
  modal.style.cssText = `
    background: white;
    border-radius: 12px;
    padding: 2rem;
    max-width: 500px;
    width: 90%;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    animation: slideIn 0.3s ease;
  `;

  modal.innerHTML = `
    <h3 style="margin: 0 0 1.5rem 0; color: #1f2937; text-align: center;">Reschedule Appointment</h3>
    
    <div style="margin-bottom: 1rem;">
      <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #374151;">New Date</label>
      <input type="date" id="new-appointment-date" 
             style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 8px; font-size: 1rem;">
    </div>
    
    <div style="margin-bottom: 1.5rem;">
      <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #374151;">New Time</label>
      <input type="time" id="new-appointment-time" 
             style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 8px; font-size: 1rem;">
    </div>
    
    <div style="display: flex; gap: 1rem; justify-content: flex-end;">
      <button id="cancel-reschedule" style="padding: 0.75rem 1.5rem; border: 1px solid #d1d5db; background: white; border-radius: 8px; cursor: pointer; font-weight: 500;">Cancel</button>
      <button id="confirm-reschedule" style="padding: 0.75rem 1.5rem; background: #1e3a8a; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">Reschedule</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Add event listeners
  document.getElementById("cancel-reschedule").addEventListener("click", () => {
    overlay.remove();
  });

  document
    .getElementById("confirm-reschedule")
    .addEventListener("click", async () => {
      const newDate = document.getElementById("new-appointment-date").value;
      const newTime = document.getElementById("new-appointment-time").value;

      if (!newDate || !newTime) {
        showCustomPopup(
          "Validation Error",
          "Please select both date and time.",
          "error"
        );
        return;
      }

      try {
        const rescheduleBtn = document.getElementById("confirm-reschedule");
        const originalText = rescheduleBtn.textContent;
        rescheduleBtn.disabled = true;
        rescheduleBtn.textContent = "Rescheduling...";

        await makeApiCall(`/appointments/${appointmentId}`, {
          method: "PUT",
          body: JSON.stringify({
            appointmentDate: newDate,
            appointmentTime: newTime,
          }),
        });

        overlay.remove();
        showCustomPopup(
          "Appointment Rescheduled",
          "Your appointment has been rescheduled successfully.",
          "success"
        );

        // Refresh appointments
        await loadAppointments();
      } catch (error) {
        const rescheduleBtn = document.getElementById("confirm-reschedule");
        rescheduleBtn.disabled = false;
        rescheduleBtn.textContent = "Reschedule";
        showCustomPopup(
          "Error",
          handleApiError(
            error,
            "Failed to reschedule appointment. Please try again."
          ),
          "error"
        );
      }
    });

  // Close on overlay click
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      overlay.remove();
    }
  });
};

// Appointment event listeners are now handled in attachAppointmentEventListeners()

// Toggle Switch Functionality
document.addEventListener("DOMContentLoaded", () => {
  const toggleSwitches = document.querySelectorAll(".toggle-switch input");

  toggleSwitches.forEach((toggle) => {
    toggle.addEventListener("change", (e) => {
      const isChecked = e.target.checked;
      const notificationType = e.target
        .closest(".notification-option")
        .querySelector("span").textContent;

      // In a real application, this would make an API call to update notification preferences
      console.log(
        `${notificationType} notifications ${
          isChecked ? "enabled" : "disabled"
        }`
      );

      // Show feedback to user
      const feedback = document.createElement("div");
      feedback.className = "toggle-feedback";
      feedback.textContent = `${notificationType} notifications ${
        isChecked ? "enabled" : "disabled"
      }`;
      feedback.style.cssText = `
        position: fixed;
        top: 2rem;
        right: 2rem;
        background-color: ${isChecked ? "#10b981" : "#6b7280"};
        color: white;
        padding: 1rem 2rem;
        border-radius: 0.5rem;
        font-size: 1.4rem;
        z-index: 1001;
        animation: slideIn 0.3s ease;
      `;

      document.body.appendChild(feedback);

      // Remove feedback after 3 seconds
      setTimeout(() => {
        feedback.remove();
      }, 3000);
    });
  });
});

// Add CSS animation for feedback
const style = document.createElement("style");
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  @keyframes fadeOut {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }
  
  @keyframes popupSlideIn {
    from {
      transform: translateY(-20px) scale(0.95);
      opacity: 0;
    }
    to {
      transform: translateY(0) scale(1);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateY(0) scale(1);
      opacity: 1;
    }
    to {
      transform: translateY(-30px) scale(0.9);
      opacity: 0;
    }
  }
  
  .custom-popup {
    animation: popupSlideIn 0.3s ease !important;
  }
`;
document.head.appendChild(style);

// Feedback Link Handler
document.addEventListener("DOMContentLoaded", () => {
  const feedbackLink = document.querySelector(".feedback-link");

  if (feedbackLink) {
    feedbackLink.addEventListener("click", (e) => {
      e.preventDefault();

      // In a real application, this would open a feedback form or redirect
      showCustomPopup("Feedback", "Opening feedback form...", "info");
      // window.location.href = "feedback.html";
    });
  }
});

// SMS Instruction Copy Functionality
document.addEventListener("DOMContentLoaded", () => {
  const smsInstruction = document.querySelector(".sms-instruction");

  if (smsInstruction) {
    smsInstruction.style.cursor = "pointer";
    smsInstruction.title = "Click to copy";

    smsInstruction.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText("JOIN 3001");
        smsInstruction.style.backgroundColor = "#10b981";
        smsInstruction.style.color = "white";
        smsInstruction.textContent = "Copied!";

        setTimeout(() => {
          smsInstruction.style.backgroundColor = "#f1f5f9";
          smsInstruction.style.color = "#1e293b";
          smsInstruction.textContent = 'Text "JOIN 3001" to 50050';
        }, 2000);
      } catch (err) {
        console.error("Failed to copy text: ", err);
        showCustomPopup(
          "Copy Failed",
          "Failed to copy text to clipboard",
          "error"
        );
      }
    });
  }
});

// Removed simulated ETA updates; will be driven by backend events.

// Auto-refresh functionality for real-time updates
let autoRefreshInterval = null;

const setupAutoRefresh = () => {
  // Clear any existing interval
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
  }

  // Refresh appointments and notifications every 30 seconds
  autoRefreshInterval = setInterval(async () => {
    try {
      console.log("Auto-refreshing patient dashboard data...");
      await Promise.all([loadAppointments(), loadNotifications()]);
    } catch (error) {
      console.error("Auto-refresh error:", error);
    }
  }, 30000); // 30 seconds

  // Also refresh when page becomes visible (user switches back to tab)
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      console.log("Page became visible, refreshing data...");
      Promise.all([loadAppointments(), loadNotifications()]).catch((error) =>
        console.error("Visibility refresh error:", error)
      );
    }
  });
};

// Load appointments from API
const loadAppointments = async () => {
  try {
    console.log("Loading appointments...");
    const response = await makeApiCall(
      "/appointments?status=scheduled,confirmed,checked-in,in-progress,in-queue"
    );

    console.log("Appointments API response:", response);

    if (response.success && response.data && response.data.appointments) {
      console.log("Found appointments:", response.data.appointments);
      updateAppointmentsDisplay(response.data.appointments);
    } else {
      console.log("No appointments found or invalid response structure");
      updateAppointmentsDisplay([]);
    }
  } catch (error) {
    console.error("Error loading appointments:", error);
    updateAppointmentsDisplay([]);
  }
};

// Update appointments display
const updateAppointmentsDisplay = (appointments) => {
  const appointmentsList = document.querySelector(".appointments-list");
  if (!appointmentsList) return;

  if (appointments.length === 0) {
    appointmentsList.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: #6b7280;">
        <p>No upcoming appointments</p>
      </div>
    `;
    return;
  }

  appointmentsList.innerHTML = appointments
    .map(
      (appointment) => `
    <div class="appointment-card" data-appointment-id="${appointment._id}">
      <div class="appointment-info">
        <div class="appointment-left">
          <span class="appointment-date">${new Date(
            appointment.appointmentDate
          ).toLocaleDateString()}</span>
          <span class="appointment-doctor">${appointment.doctor}</span>
        </div>
        <div class="appointment-right">
          <span class="appointment-time">${appointment.appointmentTime}</span>
          <span class="appointment-specialty">${appointment.specialty}</span>
        </div>
      </div>
      <div class="appointment-actions">
        <button class="action-link reschedule">Reschedule</button>
        <button class="action-link cancel">Cancel</button>
      </div>
    </div>
  `
    )
    .join("");

  // Re-attach event listeners
  attachAppointmentEventListeners();
};

// Attach event listeners to appointment buttons
const attachAppointmentEventListeners = () => {
  const rescheduleButtons = document.querySelectorAll(
    ".action-link.reschedule"
  );
  const cancelButtons = document.querySelectorAll(".action-link.cancel");

  rescheduleButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const appointmentCard = button.closest(".appointment-card");
      handleReschedule(appointmentCard);
    });
  });

  cancelButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const appointmentCard = button.closest(".appointment-card");
      handleCancelAppointment(appointmentCard);
    });
  });
};

// Initialize page
document.addEventListener("DOMContentLoaded", async () => {
  console.log("Patient Dashboard loaded successfully");

  // Check if user is logged in
  const userData = localStorage.getItem("user");
  const authToken = localStorage.getItem("authToken");

  if (!userData || !authToken) {
    // Redirect to login if not authenticated
    window.location.href = "login.html";
    return;
  }

  // Parse user data
  try {
    const user = JSON.parse(userData);
    if (user.role !== "patient") {
      // Redirect if not a patient
      window.location.href = "login.html";
      return;
    }

    // Update greeting with actual user name
    if (user.firstName) {
      const greeting = document.querySelector(".greeting");
      if (greeting) {
        greeting.textContent = `Hi, ${user.firstName}`;
      }
    }

    // Load initial data
    await Promise.all([
      loadQueueStatus(),
      loadAppointments(),
      loadNotifications(),
    ]);

    // Attach notification event listeners
    attachNotificationEventListeners();

    // Set up auto-refresh for real-time updates
    setupAutoRefresh();
  } catch (error) {
    console.error("Error parsing user data:", error);
    window.location.href = "login.html";
  }
});

// Logout functionality
function handleLogout() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("user");
  window.location.href = "login.html";
}

// Add logout to user profile icon
document.addEventListener("DOMContentLoaded", () => {
  const userProfile = document.querySelector(".user-profile");
  if (userProfile) {
    userProfile.addEventListener("click", (e) => {
      e.preventDefault();
      showConfirmDialog(
        "Logout",
        "Are you sure you want to logout? You'll need to sign in again to access your dashboard.",
        {
          confirmText: "Yes, Logout",
          cancelText: "Stay Logged In",
        }
      ).then((confirmed) => {
        if (confirmed) {
          handleLogout();
        }
      });
    });
  }
});

// Handle window resize for responsive behavior
window.addEventListener("resize", () => {
  if (window.innerWidth > 768) {
    closeMobileMenu();
  }
});

// Add loading states for better UX
const addLoadingState = (button) => {
  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = "Loading...";
  button.style.opacity = "0.7";

  return () => {
    button.disabled = false;
    button.textContent = originalText;
    button.style.opacity = "1";
  };
};

// Enhanced button handlers with loading states
const enhancedHandleViewQueue = () => {
  const removeLoading = addLoadingState(viewQueueBtn);

  setTimeout(() => {
    removeLoading();
    handleViewQueue();
  }, 1000);
};

const enhancedHandleJoinQueue = () => {
  const removeLoading = addLoadingState(joinQueueBtn);

  setTimeout(() => {
    removeLoading();
    handleJoinQueue();
  }, 1000);
};

// Replace original handlers with enhanced ones
viewQueueBtn.removeEventListener("click", handleViewQueue);
joinQueueBtn.removeEventListener("click", handleJoinQueue);
viewQueueBtn.addEventListener("click", enhancedHandleViewQueue);
joinQueueBtn.addEventListener("click", enhancedHandleJoinQueue);
