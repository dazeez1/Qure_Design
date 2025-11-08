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
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: ${type === "success" ? "#10b981" : "#ef4444"};
    color: white;
    padding: 1rem 2rem;
    border-radius: 8px;
    z-index: 1000;
    animation: slideIn 0.3s ease;
  `;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
};

// Removed formatLastActivity function as we don't need last seen

const getStatusBadge = (isActive, lastActivity) => {
  if (isActive) {
    return '<span class="status-badge active">Active</span>';
  } else {
    return '<span class="status-badge inactive">Inactive</span>';
  }
};

// API Functions
const loadStaffWithActivity = async () => {
  try {
    // Show loading state
    showLoadingState();

    const response = await fetch(`${API_BASE_URL}/settings/staff`, {
      headers: getAuthHeaders(),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        renderStaffTable(data.data);
      } else {
        renderStaffTable([]);
      }
    } else {
      renderStaffTable([]);
    }
  } catch (error) {
    console.error("Error loading staff:", error);
    renderStaffTable([]);
    showNotification("Error loading staff data", "error");
  }
};

const renderStaffTable = (staffData) => {
  const tbody = document.querySelector(".staff-table tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!staffData || staffData.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; padding: 20px; color: #6b7280;">
          No staff members found
        </td>
      </tr>
    `;
    return;
  }

  staffData.forEach((staff) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${staff.firstName} ${staff.lastName}</td>
      <td>${staff.email}</td>
      <td>${staff.role || "Staff"}</td>
      <td class="status-cell">
        ${getStatusBadge(staff.isActive, staff.lastActivityAt)}
      </td>
    `;
    tbody.appendChild(row);
  });
};

const showLoadingState = () => {
  const tbody = document.querySelector(".staff-table tbody");
  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="4" style="text-align: center; padding: 20px; color: #6b7280;">
        <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
          <div style="width: 16px; height: 16px; border: 2px solid #e5e7eb; border-top: 2px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite;"></div>
          Loading staff data...
        </div>
      </td>
    </tr>
  `;
};

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  loadStaffWithActivity();

  // Refresh staff data every 5 seconds for real-time updates
  setInterval(loadStaffWithActivity, 5000);
});

// Add CSS for status badges
const style = document.createElement("style");
style.textContent = `
  .status-badge {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
    text-transform: uppercase;
  }
  
  .status-badge.active {
    background-color: #dcfce7;
    color: #166534;
  }
  
  .status-badge.inactive {
    background-color: #fef2f2;
    color: #dc2626;
  }
  
  .status-cell {
    text-align: center;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
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
`;
document.head.appendChild(style);
