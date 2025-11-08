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
    button.textContent = "Sending...";
    button.style.opacity = "0.7";
  } else {
    button.disabled = false;
    button.textContent = originalText;
    button.style.opacity = "1";
  }
};

// API Functions
const loadNotificationSettings = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/settings/notifications`, {
      headers: getAuthHeaders(),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        populateNotificationSettings(data.data);
      }
    }
  } catch (error) {
    console.error("Error loading notification settings:", error);
    showNotification("Error loading notification settings", "error");
  }
};

const populateNotificationSettings = (settings) => {
  // Patient channels
  const patientEmailCheckbox = document.querySelector('input[type="checkbox"]');
  if (patientEmailCheckbox) {
    patientEmailCheckbox.checked = settings.patientChannels?.email || true;
  }

  // Staff channels
  const staffCheckboxes = document.querySelectorAll(
    '.form-row input[type="checkbox"]'
  );
  if (staffCheckboxes.length >= 2) {
    staffCheckboxes[1].checked = settings.staffChannels?.announcements || true;
    staffCheckboxes[2].checked =
      settings.staffChannels?.overcapacityAlerts || true;
  }
};

const saveNotificationSettings = async () => {
  try {
    const patientEmailCheckbox = document.querySelector(
      'input[type="checkbox"]'
    );
    const staffCheckboxes = document.querySelectorAll(
      '.form-row input[type="checkbox"]'
    );

    const settings = {
      patientChannels: {
        email: patientEmailCheckbox ? patientEmailCheckbox.checked : true,
        sms: false,
        push: false,
      },
      staffChannels: {
        announcements: staffCheckboxes[1] ? staffCheckboxes[1].checked : true,
        overcapacityAlerts: staffCheckboxes[2]
          ? staffCheckboxes[2].checked
          : true,
        systemUpdates: true,
      },
    };

    const response = await fetch(`${API_BASE_URL}/settings/notifications`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(settings),
    });

    const data = await response.json();
    if (data.success) {
      showNotification("Notification settings saved successfully!");
      return true;
    } else {
      showNotification(
        data.message || "Failed to save notification settings",
        "error"
      );
      return false;
    }
  } catch (error) {
    console.error("Error saving notification settings:", error);
    showNotification("Error saving notification settings", "error");
    return false;
  }
};

const showEmailInputModal = () => {
  // Remove any existing modals
  const existingModal = document.querySelector(".email-input-modal");
  if (existingModal) existingModal.remove();

  const modal = document.createElement("div");
  modal.className = "email-input-modal";
  modal.innerHTML = `
    <div class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Send Test Notification</h3>
          <button class="modal-close" onclick="this.closest('.email-input-modal').remove()">×</button>
        </div>
        <div class="modal-body">
          <p>Enter an email address to test the notification system:</p>
          <input type="email" id="test-email-input" placeholder="example@email.com" class="email-input">
          <div class="modal-actions">
            <button class="btn btn-cancel" onclick="this.closest('.email-input-modal').remove()">Cancel</button>
            <button class="btn btn-send" id="send-test-btn">Send Test</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Focus on input
  const emailInput = modal.querySelector("#test-email-input");
  emailInput.focus();

  // Handle Enter key
  emailInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      modal.querySelector("#send-test-btn").click();
    }
  });

  // Handle send button click
  modal.querySelector("#send-test-btn").addEventListener("click", async () => {
    const testEmail = emailInput.value.trim();
    if (!testEmail) {
      emailInput.style.borderColor = "#ef4444";
      emailInput.placeholder = "Please enter a valid email address";
      return;
    }

    modal.remove();
    await sendTestNotification(testEmail);
  });
};

const sendTestNotification = async (testEmail) => {
  const testButton = document.querySelector(".btn-outline");
  const originalText = testButton.textContent;
  setLoadingState(testButton, true, originalText);

  try {
    const response = await fetch(
      `${API_BASE_URL}/settings/notifications/test`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          email: testEmail,
          type: "appointment_reminder",
        }),
      }
    );

    const data = await response.json();
    if (data.success) {
      showNotification(`Test notification sent to ${testEmail}!`);
    } else {
      showNotification(
        data.message || "Failed to send test notification",
        "error"
      );
    }
  } catch (error) {
    console.error("Error sending test notification:", error);
    showNotification("Error sending test notification", "error");
  } finally {
    setLoadingState(testButton, false, originalText);
  }
};

// Initialize page
document.addEventListener("DOMContentLoaded", async () => {
  await loadNotificationSettings();

  // Save button event listener
  const saveButton = document.querySelector(".btn-primary");
  if (saveButton) {
    saveButton.addEventListener("click", async () => {
      const success = await saveNotificationSettings();
      if (success) {
        // Show success popup or redirect
        console.log("Settings saved successfully");
      }
    });
  }

  // Test button event listener
  const testButton = document.querySelector(".btn-outline");
  if (testButton) {
    testButton.addEventListener("click", showEmailInputModal);
  }

  // Cancel button event listener
  const cancelButton = document.querySelector(".btn-light");
  if (cancelButton) {
    cancelButton.addEventListener("click", () => {
      if (
        confirm(
          "Are you sure you want to cancel? Any unsaved changes will be lost."
        )
      ) {
        // Reload settings to discard changes
        loadNotificationSettings();
      }
    });
  }
});

// Add CSS for animations and notification popup
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
  
  /* Email Input Modal Styles */
  .email-input-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1050;
  }
  
  .modal-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.3s ease;
  }
  
  .modal-content {
    background: white;
    border-radius: 12px;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
    max-width: 500px;
    width: 90%;
    max-height: 90vh;
    overflow: hidden;
    animation: slideInUp 0.3s ease;
  }
  
  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24px 24px 0 24px;
    border-bottom: 1px solid #e5e7eb;
    margin-bottom: 24px;
  }
  
  .modal-header h3 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #1f2937;
  }
  
  .modal-close {
    background: none;
    border: none;
    font-size: 24px;
    color: #9ca3af;
    cursor: pointer;
    padding: 4px;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }
  
  .modal-close:hover {
    background-color: #f3f4f6;
    color: #374151;
  }
  
  .modal-body {
    padding: 0 24px 24px 24px;
  }
  
  .modal-body p {
    margin: 0 0 16px 0;
    color: #6b7280;
    font-size: 14px;
    line-height: 1.5;
  }
  
  .email-input {
    width: 100%;
    padding: 12px 16px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 16px;
    transition: border-color 0.2s;
    box-sizing: border-box;
    margin-bottom: 24px;
  }
  
  .email-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .modal-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }
  
  .modal-actions .btn {
    padding: 12px 24px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    font-weight: 500;
    font-size: 14px;
    transition: all 0.2s;
  }
  
  .modal-actions .btn-cancel {
    background-color: #f3f4f6;
    color: #374151;
  }
  
  .modal-actions .btn-cancel:hover {
    background-color: #e5e7eb;
  }
  
  .modal-actions .btn-send {
    background-color: #3b82f6;
    color: white;
  }
  
  .modal-actions .btn-send:hover {
    background-color: #2563eb;
  }
  
  .modal-actions .btn-send:disabled {
    background-color: #9ca3af;
    cursor: not-allowed;
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  @keyframes slideInUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  .form-row {
    margin-bottom: 16px;
  }
  
  .form-row label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
  }
  
  .form-row input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }
  
  .email-preview {
    background-color: #f8f9fa;
    padding: 16px;
    border-radius: 8px;
    margin-top: 12px;
    font-size: 14px;
    line-height: 1.5;
    color: #374151;
  }
  
  .email-preview span {
    font-weight: 600;
    color: #1e3a8a;
  }
  
  .btn {
    padding: 12px 24px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
  }
  
  .btn-primary {
    background-color: #3b82f6;
    color: white;
  }
  
  .btn-primary:hover {
    background-color: #2563eb;
  }
  
  .btn-outline {
    background-color: transparent;
    color: #3b82f6;
    border: 1px solid #3b82f6;
  }
  
  .btn-outline:hover {
    background-color: #3b82f6;
    color: white;
  }
  
  .btn-light {
    background-color: #f3f4f6;
    color: #374151;
  }
  
  .btn-light:hover {
    background-color: #e5e7eb;
  }
  
  .footer-actions {
    display: flex;
    gap: 12px;
    margin-top: 32px;
    justify-content: flex-end;
  }
`;
document.head.appendChild(style);
