"use strict";

// ===== Authentication Check =====
function checkAuthentication() {
  const token = localStorage.getItem("authToken");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  if (!token || !user || user.role !== "staff") {
    window.location.href = "login.html";
    return false;
  }

  return true;
}

// ===== API Helper Functions =====
async function makeApiCall(endpoint, options = {}) {
  const token = localStorage.getItem("authToken");

  const defaultOptions = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await fetch(
    `https://qure-design.onrender.com/api${endpoint}`,
    {
      ...defaultOptions,
      ...options,
    }
  );

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// ===== Popup System =====
function showPopup(message, type = "info") {
  const popup = document.createElement("div");
  popup.className = `popup-toast popup-${type}`;
  popup.setAttribute("role", "alert");
  popup.setAttribute("aria-live", "polite");
  popup.setAttribute("aria-label", "Notification");

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
      <button class="popup-close" onclick="this.parentElement.parentElement.remove()" aria-label="Close notification">×</button>
    </div>
  `;

  document.body.appendChild(popup);

  // Animate in
  setTimeout(() => popup.classList.add("show"), 100);

  // Auto remove after 3 seconds (reduced from 4 seconds)
  setTimeout(() => {
    popup.classList.remove("show");
    setTimeout(() => {
      if (document.body.contains(popup)) {
        document.body.removeChild(popup);
      }
    }, 300);
  }, 3000);
}

// ===== Dropdown Functionality =====
document.querySelectorAll(".dropdown").forEach((dropdown) => {
  const toggle = dropdown.querySelector(".dropdown-toggle");
  const content = dropdown.querySelector(".dropdown-content");
  const button = toggle.querySelector("button");

  // Toggle open/close
  toggle.addEventListener("click", () => {
    document.querySelectorAll(".dropdown").forEach((d) => {
      if (d !== dropdown) {
        d.classList.remove("open");
        d.querySelector(".dropdown-content").style.display = "none";
      }
    });

    dropdown.classList.toggle("open");
    content.style.display = dropdown.classList.contains("open")
      ? "block"
      : "none";
  });

  // ✅ This must be inside so it has access to button & content
  content.querySelectorAll("li").forEach((item) => {
    item.addEventListener("click", () => {
      button.textContent = item.textContent.trim(); // replace button label
      dropdown.classList.remove("open"); // close dropdown
      content.style.display = "none";
    });
  });
});

// Close dropdown if clicking outside
document.addEventListener("click", (e) => {
  if (!e.target.closest(".dropdown")) {
    document.querySelectorAll(".dropdown").forEach((dropdown) => {
      dropdown.classList.remove("open");
      dropdown.querySelector(".dropdown-content").style.display = "none";
    });
  }
});

// ===== Populate Dropdowns with Real Data =====
function populateDropdowns() {
  if (currentWaitingRooms.length === 0) return;

  // Get unique facilities (hospital names) and floors
  const facilities = [
    ...new Set(currentWaitingRooms.map((room) => room.hospitalName)),
  ];
  const floors = [
    ...new Set(
      currentWaitingRooms.map((room) => room.floor).filter((floor) => floor)
    ),
  ];

  // Populate facility dropdown
  const facilityDropdown = document.querySelector(".hosp-dropdown-content");
  if (facilityDropdown) {
    facilityDropdown.innerHTML = "";
    facilities.forEach((facility) => {
      const li = document.createElement("li");
      li.textContent = facility;
      li.addEventListener("click", () => {
        filterByFacility(facility);
      });
      facilityDropdown.appendChild(li);
    });
  }

  // Populate floor dropdown
  const floorDropdown = document.querySelector(".dept-dropdown-content");
  if (floorDropdown) {
    floorDropdown.innerHTML = "";
    floors.forEach((floor) => {
      const li = document.createElement("li");
      li.textContent = floor;
      li.addEventListener("click", () => {
        filterByFloor(floor);
      });
      floorDropdown.appendChild(li);
    });
  }
}

// ===== Filter Functions =====
function filterByFacility(facility) {
  const filteredRooms = currentWaitingRooms.filter(
    (room) => room.hospitalName === facility
  );
  renderWaitingRooms(filteredRooms);

  // Update button text
  const facilityButton = document.querySelector(".hosp-btn");
  if (facilityButton) {
    facilityButton.textContent = facility;
  }
}

function filterByFloor(floor) {
  const filteredRooms = currentWaitingRooms.filter(
    (room) => room.floor === floor
  );
  renderWaitingRooms(filteredRooms);

  // Update button text
  const floorButton = document.querySelector(".dept-btn");
  if (floorButton) {
    floorButton.textContent = floor;
  }
}

function clearFilters() {
  renderWaitingRooms(currentWaitingRooms);

  // Reset button texts
  const facilityButton = document.querySelector(".hosp-btn");
  const floorButton = document.querySelector(".dept-btn");
  if (facilityButton) facilityButton.textContent = "Select Facility";
  if (floorButton) floorButton.textContent = "Select Floor";
}

// ===== Global Variables =====
let currentWaitingRooms = [];
let selectedRoomId = null;

// ===== Details Panel =====
const detailsPanel = document.querySelector(".details");

function updateDetails(roomData) {
  const {
    name,
    currentOccupancy,
    capacity,
    occupancyPercentage,
    patients = [],
  } = roomData;
  const isCritical = occupancyPercentage >= 100;

  detailsPanel.innerHTML = `
    <h2>${name}</h2>
    <p>${currentOccupancy}/${capacity} (${occupancyPercentage}%)</p>
    ${isCritical ? '<div class="critical">CRITICAL</div>' : ""}
    <div class="patient-list">
      ${
        patients.length
          ? patients
              .map(
                (p) =>
                  `<div><span>${p.name} (${p.queueNumber})</span><span>${p.waitTime} mins</span></div>`
              )
              .join("")
          : "<p>No patients yet.</p>"
      }
    </div>
    <div class="actions">
      <button onclick="handleEmailNotification('${
        roomData._id
      }')">Email</button>
      <button onclick="handleSpeakerNotification('${
        roomData._id
      }')">Speaker</button>
      <button class="confirm" onclick="handleConfirmAction('${
        roomData._id
      }')">Update Occupancy</button>
      <button class="edit" onclick="handleEditWaitingRoom('${
        roomData._id
      }')">Edit Room</button>
      <button class="delete" onclick="handleDeleteWaitingRoom('${
        roomData._id
      }', '${name}')">Delete Room</button>
    </div>
  `;
}

// ===== Load Waiting Rooms Data =====
async function loadWaitingRooms() {
  try {
    const data = await makeApiCall("/waiting-rooms");

    if (data.success && data.data) {
      currentWaitingRooms = data.data;
      renderWaitingRooms(currentWaitingRooms);
      populateDropdowns();
    } else {
      currentWaitingRooms = [];
      renderWaitingRooms([]);
    }
  } catch (error) {
    console.error("Error loading waiting rooms:", error);
    showPopup(
      "Failed to load waiting rooms. Please check your connection and try again.",
      "error"
    );
    currentWaitingRooms = [];
    renderWaitingRooms([]);
  }
}

// ===== Render Waiting Rooms =====
function renderWaitingRooms(rooms) {
  const waitingAreas = document.querySelector(".waiting-areas");
  waitingAreas.innerHTML = "";

  if (rooms.length === 0) {
    waitingAreas.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: #6b7280;">
        <h3>No waiting rooms available</h3>
        <p>Create your first waiting room to get started.</p>
      </div>
    `;
    return;
  }

  rooms.forEach((room) => {
    const roomEl = createRoomElement(room);
    waitingAreas.appendChild(roomEl);
  });
}

// ===== Create Room Element =====
function createRoomElement(room) {
  const roomEl = document.createElement("div");
  roomEl.className = `room ${room.color}`;
  roomEl.dataset.roomId = room._id;

  const lastUpdated = new Date(room.lastUpdated);
  const timeAgo = getTimeAgo(lastUpdated);

  roomEl.innerHTML = `
    <h3>${room.name}</h3>
    <p>${room.description}</p>
    <span>${room.currentOccupancy}/${room.capacity} (${
    room.occupancyPercentage
  }%) - Status: ${room.status || "unknown"} - Last updated: ${timeAgo}</span>
  `;

  // Attach click event
  roomEl.addEventListener("click", async () => {
    selectedRoomId = room._id;
    await loadRoomDetails(room._id);
  });

  return roomEl;
}

// ===== Load Room Details =====
async function loadRoomDetails(roomId) {
  try {
    const data = await makeApiCall(`/waiting-rooms/${roomId}`);
    updateDetails(data.data);
  } catch (error) {
    console.error("Error loading room details:", error);
    showPopup("Failed to load room details", "error");
  }
}

// ===== Helper Functions =====
function getTimeAgo(date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  return `${Math.floor(diffInSeconds / 86400)} days ago`;
}

// ===== Modal System =====
function showModal(title, content, onConfirm, confirmText = "Confirm") {
  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "modal-title");
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3 id="modal-title">${title}</h3>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-body">
        ${content}
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary modal-cancel">Cancel</button>
        <button class="btn btn-primary modal-confirm">${confirmText}</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Close modal handlers
  const closeModal = () => {
    document.body.removeChild(modal);
  };

  modal.querySelector(".modal-close").addEventListener("click", closeModal);
  modal.querySelector(".modal-cancel").addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // Confirm handler
  modal.querySelector(".modal-confirm").addEventListener("click", () => {
    onConfirm();
    closeModal();
  });

  // Show modal with animation
  setTimeout(() => modal.classList.add("show"), 10);
}

// ===== Action Handlers =====
async function handleEmailNotification(roomId) {
  const room = currentWaitingRooms.find((r) => r._id === roomId);
  const roomName = room ? room.name : "this waiting room";

  showModal(
    "Send Email Notification",
    `
      <div class="form-group">
        <label>Send email notification to all patients in <strong>${roomName}</strong></label>
        <textarea id="email-message" placeholder="Enter your notification message..." rows="4" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; resize: vertical;"></textarea>
      </div>
    `,
    async () => {
      const message = document.getElementById("email-message").value.trim();
      if (!message) {
        showPopup("Please enter a message", "warning");
        return;
      }

      try {
        await makeApiCall(`/waiting-rooms/${roomId}/notify`, {
          method: "POST",
          body: JSON.stringify({
            message,
            type: "email",
          }),
        });

        showPopup("Email notification sent successfully", "success");
      } catch (error) {
        console.error("Error sending email notification:", error);
        showPopup("Failed to send email notification", "error");
      }
    },
    "Send Email"
  );
}

async function handleSpeakerNotification(roomId) {
  const room = currentWaitingRooms.find((r) => r._id === roomId);
  const roomName = room ? room.name : "this waiting room";

  showModal(
    "Make Speaker Announcement",
    `
      <div class="form-group">
        <label>Make speaker announcement in <strong>${roomName}</strong></label>
        <textarea id="speaker-message" placeholder="Enter your announcement message..." rows="4" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; resize: vertical;"></textarea>
      </div>
    `,
    async () => {
      const message = document.getElementById("speaker-message").value.trim();
      if (!message) {
        showPopup("Please enter a message", "warning");
        return;
      }

      try {
        await makeApiCall(`/waiting-rooms/${roomId}/notify`, {
          method: "POST",
          body: JSON.stringify({
            message,
            type: "speaker",
          }),
        });

        showPopup("Speaker announcement sent successfully", "success");
      } catch (error) {
        console.error("Error sending speaker announcement:", error);
        showPopup("Failed to send speaker announcement", "error");
      }
    },
    "Make Announcement"
  );
}

async function handleConfirmAction(roomId) {
  const room = currentWaitingRooms.find((r) => r._id === roomId);
  const roomName = room ? room.name : "this waiting room";
  const currentOccupancy = room ? room.currentOccupancy : 0;
  const capacity = room ? room.capacity : 0;

  showModal(
    "Update Occupancy",
    `
      <div class="form-group">
        <label>Update occupancy for <strong>${roomName}</strong></label>
        <p style="margin: 8px 0; color: #666;">Current: ${currentOccupancy}/${capacity}</p>
        <input type="number" id="occupancy-input" value="${currentOccupancy}" min="0" max="${capacity}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
        <small style="color: #666;">Enter the current number of patients in this waiting room</small>
      </div>
    `,
    async () => {
      const occupancy = parseInt(
        document.getElementById("occupancy-input").value
      );
      if (isNaN(occupancy) || occupancy < 0) {
        showPopup("Please enter a valid number", "warning");
        return;
      }

      try {
        await makeApiCall(`/waiting-rooms/${roomId}/occupancy`, {
          method: "PUT",
          body: JSON.stringify({ occupancy }),
        });

        showPopup("Occupancy updated successfully", "success");
        await loadWaitingRooms(); // Refresh the data
        if (selectedRoomId === roomId) {
          await loadRoomDetails(roomId); // Refresh details panel
        }
      } catch (error) {
        console.error("Error updating occupancy:", error);
        showPopup("Failed to update occupancy", "error");
      }
    },
    "Update Occupancy"
  );
}

// ===== Add New Waiting Area =====
const addBtn = document.querySelector(".add-btn");

addBtn.addEventListener("click", () => {
  showModal(
    "Add New Waiting Area",
    `
      <div class="form-group">
        <label>Waiting Room Name *</label>
        <input type="text" id="room-name" placeholder="e.g., Waiting Room G" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
      </div>
      <div class="form-group">
        <label>Description *</label>
        <input type="text" id="room-description" placeholder="e.g., Cardiology Waiting Area" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
      </div>
      <div class="form-group">
        <label>Capacity *</label>
        <input type="number" id="room-capacity" placeholder="e.g., 20" min="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
      </div>
      <div class="form-group">
        <label>Floor (Optional)</label>
        <input type="text" id="room-floor" placeholder="e.g., 2nd Floor" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
      </div>
      <div class="form-group">
        <label>Specialties (Optional)</label>
        <input type="text" id="room-specialties" placeholder="e.g., Cardiology, Neurology (comma-separated)" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
        <small style="color: #666;">Enter medical specialties separated by commas</small>
      </div>
    `,
    async () => {
      const name = document.getElementById("room-name").value.trim();
      const description = document
        .getElementById("room-description")
        .value.trim();
      const capacity = document.getElementById("room-capacity").value.trim();
      const floor = document.getElementById("room-floor").value.trim();
      const specialtiesInput = document
        .getElementById("room-specialties")
        .value.trim();

      if (!name || !description || !capacity) {
        showPopup("Please fill in all required fields", "warning");
        return;
      }

      const specialties = specialtiesInput
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s);

      try {
        await makeApiCall("/waiting-rooms", {
          method: "POST",
          body: JSON.stringify({
            name,
            description,
            capacity: parseInt(capacity),
            floor,
            specialties,
          }),
        });

        showPopup("Waiting room created successfully", "success");
        await loadWaitingRooms(); // Refresh the data
      } catch (error) {
        console.error("Error creating waiting room:", error);
        showPopup("Failed to create waiting room", "error");
      }
    },
    "Create Room"
  );
});

// ===== Edit Waiting Room =====
async function handleEditWaitingRoom(roomId) {
  const room = currentWaitingRooms.find((r) => r._id === roomId);
  if (!room) {
    showPopup("Waiting room not found", "error");
    return;
  }

  showModal(
    "Edit Waiting Room",
    `
      <div class="form-group">
        <label>Waiting Room Name *</label>
        <input type="text" id="edit-room-name" value="${
          room.name
        }" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
      </div>
      <div class="form-group">
        <label>Description *</label>
        <input type="text" id="edit-room-description" value="${
          room.description || ""
        }" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
      </div>
      <div class="form-group">
        <label>Capacity *</label>
        <input type="number" id="edit-room-capacity" value="${
          room.capacity
        }" min="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
      </div>
      <div class="form-group">
        <label>Floor (Optional)</label>
        <input type="text" id="edit-room-floor" value="${
          room.floor || ""
        }" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
      </div>
      <div class="form-group">
        <label>Specialties (Optional)</label>
        <input type="text" id="edit-room-specialties" value="${
          room.specialties ? room.specialties.join(", ") : ""
        }" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
        <small style="color: #666;">Enter medical specialties separated by commas</small>
      </div>
    `,
    async () => {
      const name = document.getElementById("edit-room-name").value.trim();
      const description = document
        .getElementById("edit-room-description")
        .value.trim();
      const capacity = document
        .getElementById("edit-room-capacity")
        .value.trim();
      const floor = document.getElementById("edit-room-floor").value.trim();
      const specialtiesInput = document
        .getElementById("edit-room-specialties")
        .value.trim();

      if (!name || !description || !capacity) {
        showPopup("Please fill in all required fields", "warning");
        return;
      }

      const specialties = specialtiesInput
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s);

      try {
        await makeApiCall(`/waiting-rooms/${roomId}`, {
          method: "PUT",
          body: JSON.stringify({
            name,
            description,
            capacity: parseInt(capacity),
            floor,
            specialties,
          }),
        });

        showPopup("Waiting room updated successfully", "success");
        await loadWaitingRooms(); // Refresh the data
        if (selectedRoomId === roomId) {
          await loadRoomDetails(roomId); // Refresh details panel
        }
      } catch (error) {
        console.error("Error updating waiting room:", error);
        showPopup("Failed to update waiting room", "error");
      }
    },
    "Update Room"
  );
}

// ===== Delete Waiting Room =====
async function handleDeleteWaitingRoom(roomId, roomName) {
  showModal(
    "Delete Waiting Room",
    `
      <div class="form-group">
        <p>Are you sure you want to delete <strong>"${roomName}"</strong>?</p>
        <p style="color: #ef4444; font-weight: 500;">This action cannot be undone.</p>
      </div>
    `,
    async () => {
      try {
        await makeApiCall(`/waiting-rooms/${roomId}`, {
          method: "DELETE",
        });

        showPopup("Waiting room deleted successfully", "success");
        await loadWaitingRooms(); // Refresh the data

        // Clear details panel if the deleted room was selected
        if (selectedRoomId === roomId) {
          selectedRoomId = null;
          detailsPanel.innerHTML = `
            <h2>Select a waiting room</h2>
            <p>Click on a waiting room to view details and manage it.</p>
          `;
        }
      } catch (error) {
        console.error("Error deleting waiting room:", error);
        showPopup("Failed to delete waiting room", "error");
      }
    },
    "Delete Room"
  );
}

// ===== Real-time Updates =====
function startRealTimeUpdates() {
  // Refresh data every 30 seconds
  setInterval(async () => {
    try {
      await loadWaitingRooms();
      if (selectedRoomId) {
        await loadRoomDetails(selectedRoomId);
      }
    } catch (error) {
      console.error("Error in real-time update:", error);
    }
  }, 30000);
}

// ===== Initialize Socket.IO for Real-time Updates =====
function initializeSocketIO() {
  if (!window.socketClient) {
    console.error("Socket.IO client not available");
    return;
  }

  // Connect to Socket.IO
  window.socketClient.connect();

  // Handle Socket.IO connection events
  window.socketClient.on("connected", (data) => {
    console.log("Socket.IO connected for waiting rooms:", data);
    showPopup("Real-time updates enabled", "success");
  });

  window.socketClient.on("disconnected", (data) => {
    console.log("Socket.IO disconnected:", data);
    showPopup("Real-time updates disabled", "warning");
  });

  // Handle waiting room updates
  window.socketClient.on("waitingRoomUpdate", (data) => {
    console.log("Waiting room update received:", data);
    handleWaitingRoomUpdate(data);
  });

  // Handle queue updates that might affect waiting rooms
  window.socketClient.on("queueUpdate", (data) => {
    console.log("Queue update received:", data);
    // Refresh waiting rooms when queue updates occur
    loadWaitingRooms();
  });
}

// Handle real-time waiting room updates
function handleWaitingRoomUpdate(data) {
  console.log("Handling waiting room update:", data);

  // Update specific room if we have room data
  if (data.roomId && data.type) {
    // Find the room element and update it
    const roomElement = document.querySelector(
      `[data-room-id="${data.roomId}"]`
    );
    if (roomElement) {
      updateRoomElement(roomElement, data);
    }

    // Update details panel if this room is selected
    if (selectedRoomId === data.roomId) {
      loadRoomDetails(data.roomId);
    }

    // Show notification for specific events
    if (data.type === "occupancy_updated") {
      showPopup(
        `Room occupancy updated: ${data.currentOccupancy}/${data.capacity}`,
        "info"
      );
    } else if (data.type === "patients_assigned") {
      showPopup(`${data.patientCount} patients assigned to room`, "success");
    }
  }

  // Refresh all waiting rooms to ensure consistency
  loadWaitingRooms();
}

// Update room element with new data
function updateRoomElement(roomElement, data) {
  if (data.currentOccupancy !== undefined && data.capacity !== undefined) {
    const occupancyPercentage = Math.round(
      (data.currentOccupancy / data.capacity) * 100
    );
    const statusText = roomElement.querySelector("span");
    if (statusText) {
      statusText.textContent = `${data.currentOccupancy}/${
        data.capacity
      } (${occupancyPercentage}%) - Status: ${
        data.status || "unknown"
      } - Last updated: Just now`;
    }

    // Update room color class based on occupancy
    roomElement.className = `room ${data.color || "green"}`;
  }
}

// ===== Initialize Page =====
document.addEventListener("DOMContentLoaded", async () => {
  if (!checkAuthentication()) return;

  try {
    await loadWaitingRooms();

    // Initialize Socket.IO for real-time updates
    initializeSocketIO();

    // Keep fallback polling but with reduced frequency
    startRealTimeUpdates();
  } catch (error) {
    console.error("Error initializing page:", error);
    showPopup("Failed to load page data", "error");
  }
});
