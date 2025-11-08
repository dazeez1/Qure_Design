"use strict";

// API Configuration
const API_BASE_URL = "https://qure-design.onrender.com/api";

// Utility Functions
const getAuthHeaders = () => {
  const token = localStorage.getItem("authToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

const showNotification = (message, type = "success") => {
  // Remove any existing notifications
  const existingNotifications = document.querySelectorAll(
    ".notification-popup"
  );
  existingNotifications.forEach((notif) => notif.remove());

  const notification = document.createElement("div");
  notification.className = `notification-popup ${type}`;

  const icon = type === "success" ? "✓" : "⚠";
  const title = type === "success" ? "Success" : "Error";

  notification.innerHTML = `
    <div class="notification-content">
      <div class="notification-icon">${icon}</div>
      <div class="notification-text">
        <div class="notification-title">${title}</div>
        <div class="notification-message">${message}</div>
      </div>
      <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
    </div>
  `;

  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    border: 1px solid ${type === "success" ? "#10b981" : "#ef4444"};
    border-left: 4px solid ${type === "success" ? "#10b981" : "#ef4444"};
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
    z-index: 1000;
    animation: slideInRight 0.3s ease;
    min-width: 300px;
    max-width: 400px;
  `;

  document.body.appendChild(notification);

  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.style.animation = "slideOutRight 0.3s ease";
      setTimeout(() => notification.remove(), 300);
    }
  }, 5000);
};

const setLoadingState = (button, isLoading, originalText) => {
  if (isLoading) {
    button.disabled = true;
    button.textContent = "Saving...";
    button.style.opacity = "0.7";
  } else {
    button.disabled = false;
    button.textContent = originalText;
    button.style.opacity = "1";
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  const hospitalName = document.getElementById("hospital-name");
  const address = document.getElementById("address");
  const timezoneSelect = document.getElementById("timezone");
  const lowCapacityInput = document.querySelector("input[value='25']");
  const mediumCapacityInput = document.querySelector("input[value='50']");
  const highCapacityInput = document.querySelector("input[value='100']");

  const saveBtn = document.querySelector(".btn.save");
  const cancelBtn = document.querySelector(".btn.cancel");

  const popupSaveConfirm = document.getElementById("popup-save-confirm");
  const confirmSave = document.getElementById("confirm-save");
  const closeSaveConfirm = document.getElementById("close-save-confirm");

  const popupSaveSuccess = document.getElementById("popup-save-success");
  const closeSaveSuccess = document.getElementById("close-save-success");

  const popupError = document.getElementById("popup-error");
  const closeError = document.getElementById("close-error");

  const popupCancel = document.getElementById("popup-cancel");
  const confirmCancel = document.getElementById("confirm-cancel");
  const closeCancel = document.getElementById("close-cancel");

  let currentSettings = null;

  // Load existing settings
  const loadSettings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/settings/organization`, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          currentSettings = data.data;

          // Populate form with existing data
          hospitalName.value = currentSettings.hospitalName || "";
          address.value = currentSettings.address || "";
          timezoneSelect.value = currentSettings.timezone || "Africa/Lagos";

          if (currentSettings.capacityThresholds) {
            lowCapacityInput.value =
              currentSettings.capacityThresholds.low || 25;
            mediumCapacityInput.value =
              currentSettings.capacityThresholds.medium || 50;
            highCapacityInput.value =
              currentSettings.capacityThresholds.high || 100;
          }
        }
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  // Save settings to backend
  const saveSettings = async () => {
    try {
      const settingsData = {
        hospitalName: hospitalName.value.trim(),
        address: address.value.trim(),
        timezone: timezoneSelect.value,
        capacityThresholds: {
          low: parseInt(lowCapacityInput.value) || 25,
          medium: parseInt(mediumCapacityInput.value) || 50,
          high: parseInt(highCapacityInput.value) || 100,
        },
      };

      const response = await fetch(`${API_BASE_URL}/settings/organization`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(settingsData),
      });

      const data = await response.json();

      if (data.success) {
        showNotification("Organization settings saved successfully!");
        currentSettings = data.data;
        return true;
      } else {
        showNotification(data.message || "Failed to save settings", "error");
        return false;
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      showNotification("Error saving settings", "error");
      return false;
    }
  };

  // Load settings on page load
  await loadSettings();

  // Add CSS for notification popup
  const style = document.createElement("style");
  style.textContent = `
    @keyframes slideInRight {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    @keyframes slideOutRight {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
    
    .notification-popup {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .notification-content {
      display: flex;
      align-items: flex-start;
      padding: 16px;
      gap: 12px;
    }
    
    .notification-icon {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 14px;
      flex-shrink: 0;
    }
    
    .notification-popup.success .notification-icon {
      background-color: #10b981;
      color: white;
    }
    
    .notification-popup.error .notification-icon {
      background-color: #ef4444;
      color: white;
    }
    
    .notification-text {
      flex: 1;
    }
    
    .notification-title {
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 4px;
      color: #1f2937;
    }
    
    .notification-message {
      font-size: 13px;
      color: #6b7280;
      line-height: 1.4;
    }
    
    .notification-close {
      background: none;
      border: none;
      font-size: 18px;
      color: #9ca3af;
      cursor: pointer;
      padding: 0;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: background-color 0.2s;
    }
    
    .notification-close:hover {
      background-color: #f3f4f6;
      color: #374151;
    }
    
    /* Form styling improvements */
    #address {
      resize: vertical;
      min-height: 80px;
      font-family: inherit;
      line-height: 1.5;
    }
    
    #timezone {
      width: 100%;
      padding: 12px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 14px;
      background-color: white;
    }
    
    #timezone:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    
    label {
      font-weight: 600;
      color: #374151;
      margin-bottom: 8px;
      display: block;
    }
    
    .form-left, .form-right {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
  `;
  document.head.appendChild(style);

  saveBtn.addEventListener("click", () => {
    if (
      !hospitalName.value.trim() ||
      !address.value.trim() ||
      !timezoneSelect.value
    ) {
      popupError.style.display = "flex";
    } else {
      popupSaveConfirm.style.display = "flex";
    }
  });

  confirmSave.addEventListener("click", async () => {
    popupSaveConfirm.style.display = "none";
    setLoadingState(saveBtn, true, "Save");

    const success = await saveSettings();

    if (success) {
      popupSaveSuccess.style.display = "flex";
    }

    setLoadingState(saveBtn, false, "Save");
  });

  closeSaveConfirm.addEventListener(
    "click",
    () => (popupSaveConfirm.style.display = "none")
  );
  closeSaveSuccess.addEventListener(
    "click",
    () => (popupSaveSuccess.style.display = "none")
  );
  closeError.addEventListener(
    "click",
    () => (popupError.style.display = "none")
  );

  cancelBtn.addEventListener(
    "click",
    () => (popupCancel.style.display = "flex")
  );
  closeCancel.addEventListener(
    "click",
    () => (popupCancel.style.display = "none")
  );
  confirmCancel.addEventListener("click", () => {
    popupCancel.style.display = "none";
    hospitalName.value = "";
    address.value = "";
    timezoneSelect.value = "";
  });

  document.querySelectorAll(".popup").forEach((popup) => {
    popup.addEventListener("click", (e) => {
      if (e.target === popup) popup.style.display = "none";
    });
  });
});
