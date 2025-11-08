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

const tbody = document.querySelector("#deptTable tbody");
const addBtn = document.getElementById("addDeptBtn");
const saveAllBtn = document.getElementById("saveAllBtn");
const savedIndicator = document.getElementById("savedIndicator");

const modal = document.getElementById("confirmModal");
const modalMessage = document.getElementById("modalMessage");
const yesBtn = document.getElementById("yesBtn");
const noBtn = document.getElementById("noBtn");

let modalAction = null;
let departments = [];

// API Functions
const loadDepartments = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/settings/departments`, {
      headers: getAuthHeaders(),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        departments = data.data;
        renderDepartments();
      }
    }
  } catch (error) {
    console.error("Error loading departments:", error);
    showNotification("Error loading departments", "error");
  }
};

const createDepartment = async (departmentData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/settings/departments`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(departmentData),
    });

    const data = await response.json();
    if (data.success) {
      departments.push(data.data);
      showNotification("Department created successfully!");
      return data.data;
    } else {
      showNotification(data.message || "Failed to create department", "error");
      return null;
    }
  } catch (error) {
    console.error("Error creating department:", error);
    showNotification("Error creating department", "error");
    return null;
  }
};

const updateDepartment = async (id, departmentData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/settings/departments/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(departmentData),
    });

    const data = await response.json();
    if (data.success) {
      const index = departments.findIndex((dept) => dept._id === id);
      if (index !== -1) {
        departments[index] = data.data;
      }
      showNotification("Department updated successfully!");
      return data.data;
    } else {
      showNotification(data.message || "Failed to update department", "error");
      return null;
    }
  } catch (error) {
    console.error("Error updating department:", error);
    showNotification("Error updating department", "error");
    return null;
  }
};

const deleteDepartment = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/settings/departments/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    const data = await response.json();
    if (data.success) {
      departments = departments.filter((dept) => dept._id !== id);
      showNotification("Department deleted successfully!");
      return true;
    } else {
      showNotification(data.message || "Failed to delete department", "error");
      return false;
    }
  } catch (error) {
    console.error("Error deleting department:", error);
    showNotification("Error deleting department", "error");
    return false;
  }
};

const renderDepartments = () => {
  tbody.innerHTML = "";
  departments.forEach((dept) => {
    const row = createDisplayRow(
      dept.name,
      dept.shortCode,
      dept.status,
      dept._id
    );
    tbody.appendChild(row);
  });
};

function openModal(message, action) {
  modalMessage.textContent = message;
  modal.style.display = "flex";
  modalAction = action;
}

yesBtn.addEventListener("click", () => {
  if (modalAction) modalAction();
  modal.style.display = "none";
});

noBtn.addEventListener("click", () => {
  modal.style.display = "none";
  modalAction = null;
});

function createDisplayRow(dept, code, status, id) {
  const tr = document.createElement("tr");
  tr.dataset.departmentId = id;
  tr.innerHTML = `
    <td>${escapeHtml(dept)}</td>
    <td>${escapeHtml(code)}</td>
    <td><span class="status ${status}">${capitalize(status)}</span></td>
    <td>
      <div class="action-icons">
        <span class="material-symbols-outlined edit">edit</span>
        <span class="material-symbols-outlined delete">delete</span>
      </div>
    </td>
  `;
  attachRowEvents(tr);
  return tr;
}

function createEditableRow(
  dept = "",
  code = "",
  status = "active",
  isNew = true
) {
  const tr = document.createElement("tr");
  tr.dataset.isNew = isNew ? "true" : "false";
  tr.innerHTML = `
    <td><input type="text" value="${escapeHtml(
      dept
    )}" placeholder="Department" /></td>
    <td><input type="text" value="${escapeHtml(
      code
    )}" placeholder="Short code" /></td>
    <td>
      <select>
        <option value="active" ${
          status === "active" ? "selected" : ""
        }>Active</option>
        <option value="inactive" ${
          status === "inactive" ? "selected" : ""
        }>Inactive</option>
      </select>
    </td>
    <td>
      <div class="action-icons">
        <span class="material-symbols-outlined save">check</span>
        <span class="material-symbols-outlined cancel">close</span>
      </div>
    </td>
  `;

  tr.querySelector(".save").addEventListener("click", async () => {
    const inputs = tr.querySelectorAll("input[type=text]");
    const deptVal = inputs[0].value.trim();
    const codeVal = inputs[1].value.trim();
    const statusVal = tr.querySelector("select").value;

    if (!deptVal || !codeVal) {
      showNotification(
        "Please fill Department and Short code before saving this row.",
        "error"
      );
      return;
    }

    const departmentData = {
      name: deptVal,
      shortCode: codeVal,
      status: statusVal,
    };

    if (tr.dataset.isNew === "true") {
      // Create new department
      const newDepartment = await createDepartment(departmentData);
      if (newDepartment) {
        const newRow = createDisplayRow(
          deptVal,
          codeVal,
          statusVal,
          newDepartment._id
        );
        tr.replaceWith(newRow);
      }
    } else {
      // Update existing department
      const departmentId = tr.dataset.departmentId;
      const updatedDepartment = await updateDepartment(
        departmentId,
        departmentData
      );
      if (updatedDepartment) {
        const newRow = createDisplayRow(
          deptVal,
          codeVal,
          statusVal,
          departmentId
        );
        tr.replaceWith(newRow);
      }
    }
  });

  tr.querySelector(".cancel").addEventListener("click", () => {
    openModal("Do you want to cancel changes?", () => {
      if (tr.dataset.isNew === "true") {
        tr.remove();
      } else {
        const origDept = tr.dataset.origDept || "";
        const origCode = tr.dataset.origCode || "";
        const origStatus = tr.dataset.origStatus || "active";
        const restored = createDisplayRow(origDept, origCode, origStatus);
        tr.replaceWith(restored);
      }
    });
  });

  return tr;
}

function attachRowEvents(row) {
  const editBtn = row.querySelector(".edit");
  const deleteBtn = row.querySelector(".delete");

  if (editBtn) {
    editBtn.addEventListener("click", () => {
      const dept = row.cells[0].innerText.trim();
      const code = row.cells[1].innerText.trim();
      const status = row.cells[2].innerText.trim().toLowerCase();

      const editable = createEditableRow(dept, code, status, false);
      editable.dataset.departmentId = row.dataset.departmentId;
      editable.dataset.origDept = dept;
      editable.dataset.origCode = code;
      editable.dataset.origStatus = status;
      row.replaceWith(editable);
    });
  }

  if (deleteBtn) {
    deleteBtn.addEventListener("click", () => {
      const departmentId = row.dataset.departmentId;
      openModal("Do you want to delete this department?", async () => {
        const success = await deleteDepartment(departmentId);
        if (success) {
          row.remove();
        }
      });
    });
  }
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function indicateUnsaved() {
  savedIndicator.style.display = "none";
}

function saveAllToStorage() {
  const rows = Array.from(tbody.rows);
  const data = rows.map((r) => {
    const input = r.querySelector("input[type=text]");
    if (input) {
      return {
        dept: r.querySelectorAll("input[type=text]")[0].value.trim(),
        code: r.querySelectorAll("input[type=text]")[1].value.trim(),
        status: r.querySelector("select").value,
      };
    } else {
      return {
        dept: r.cells[0].innerText.trim(),
        code: r.cells[1].innerText.trim(),
        status: r.cells[2].innerText.trim().toLowerCase(),
      };
    }
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  savedIndicator.style.display = "inline-block";
  setTimeout(() => {
    savedIndicator.style.display = "none";
  }, 1400);
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return;

    tbody.innerHTML = "";
    arr.forEach((item) => {
      const r = createDisplayRow(
        item.dept || "",
        item.code || "",
        item.status || "active"
      );
      tbody.appendChild(r);
    });
  } catch (e) {
    console.error("Failed to load departments", e);
  }
}

addBtn.addEventListener("click", () => {
  const editable = createEditableRow("", "", "active", true);
  tbody.appendChild(editable);
  const firstInput = editable.querySelector("input[type=text]");
  if (firstInput) firstInput.focus();
});

saveAllBtn.addEventListener("click", () => {
  showNotification("All departments are automatically saved!", "success");
});

// Load departments when page loads
document.addEventListener("DOMContentLoaded", () => {
  loadDepartments();

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
  `;
  document.head.appendChild(style);
});
