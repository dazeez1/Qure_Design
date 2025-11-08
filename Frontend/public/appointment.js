// ===== Constants =====
const API_BASE_URL = "https://qure-design.onrender.com/api";

// ===== DOM Elements =====
const tableBody = document.getElementById("appointmentsTableBody");
const newApptBtn = document.querySelector(".new-appt-btn");
const profileSection = document.querySelector(".profile-details");
const modal = document.getElementById("appointmentModal");
const closeBtn = document.querySelector(".close-btn");
const apptForm = document.getElementById("appointmentForm");

// ===== Global Variables =====
let allAppointments = [];
let filteredAppointments = [];
let currentFilter = "all";
let selectedAppointment = null;
let selectedDepartment = "";
let selectedDateRange = { start: "", end: "" };
let currentPage = 1;
let itemsPerPage = 10;
let totalPages = 1;

// ===== Color Coding Functions =====
const getStatusColor = (status) => {
  const statusColors = {
    scheduled: "#3B82F6", // Blue
    confirmed: "#10B981", // Green
    "checked-in": "#F59E0B", // Amber
    completed: "#059669", // Emerald
    cancelled: "#EF4444", // Red
    "no-show": "#6B7280", // Gray
  };
  return statusColors[status] || "#6B7280";
};

const getTypeColor = (type) => {
  const typeColors = {
    consultation: "#8B5CF6", // Purple
    "follow-up": "#06B6D4", // Cyan
    emergency: "#EF4444", // Red
    routine: "#10B981", // Green
    specialist: "#F59E0B", // Amber
    general: "#3B82F6", // Blue
  };
  return typeColors[type] || "#6B7280";
};

// ===== Filter Functions =====
const applyFilters = () => {
  let filtered = [...allAppointments];

  // Always exclude completed appointments from the main table
  filtered = filtered.filter((apt) => apt.status !== "completed");

  // Apply status filter
  if (currentFilter !== "all") {
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59
    );

    switch (currentFilter) {
      case "today":
        filtered = filtered.filter((apt) => {
          const aptDate = new Date(apt.appointmentDate);
          return aptDate >= startOfDay && aptDate <= endOfDay;
        });
        break;
      case "upcoming":
        filtered = filtered.filter(
          (apt) => new Date(apt.appointmentDate) > endOfDay
        );
        break;
      case "past":
        filtered = filtered.filter(
          (apt) => new Date(apt.appointmentDate) < startOfDay
        );
        break;
      case "cancelled":
        filtered = filtered.filter((apt) => apt.status === "cancelled");
        break;
    }
  }

  // Apply department filter
  if (selectedDepartment) {
    const beforeCount = filtered.length;
    filtered = filtered.filter((apt) => apt.specialty === selectedDepartment);
  }

  // Apply date range filter
  if (selectedDateRange.start && selectedDateRange.end) {
    const startDate = new Date(selectedDateRange.start);
    const endDate = new Date(selectedDateRange.end);
    endDate.setHours(23, 59, 59, 999); // Include the entire end date

    filtered = filtered.filter((apt) => {
      const aptDate = new Date(apt.appointmentDate);
      return aptDate >= startDate && aptDate <= endDate;
    });
  }

  filteredAppointments = filtered;

  // Update pagination
  totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  if (currentPage > totalPages) {
    currentPage = 1;
  }
};

// ===== Pagination Functions =====
const updatePagination = () => {
  const paginationContainer = document.querySelector(".pagination");
  if (!paginationContainer) return;

  if (totalPages <= 1) {
    paginationContainer.innerHTML = "";
    return;
  }

  let paginationHTML = "";

  // Previous button
  paginationHTML += `
    <button class="pagination-btn ${currentPage === 1 ? "disabled" : ""}" 
            onclick="changePage(${currentPage - 1})" 
            ${currentPage === 1 ? "disabled" : ""}>
      <i class="fas fa-chevron-left"></i>
    </button>
  `;

  // Page numbers
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);

  if (startPage > 1) {
    paginationHTML += `<button class="pagination-btn" onclick="changePage(1)">1</button>`;
    if (startPage > 2) {
      paginationHTML += `<span class="pagination-dots">...</span>`;
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    paginationHTML += `
      <button class="pagination-btn ${i === currentPage ? "active" : ""}" 
              onclick="changePage(${i})">
        ${i}
      </button>
    `;
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      paginationHTML += `<span class="pagination-dots">...</span>`;
    }
    paginationHTML += `<button class="pagination-btn" onclick="changePage(${totalPages})">${totalPages}</button>`;
  }

  // Next button
  paginationHTML += `
    <button class="pagination-btn ${
      currentPage === totalPages ? "disabled" : ""
    }" 
            onclick="changePage(${currentPage + 1})" 
            ${currentPage === totalPages ? "disabled" : ""}>
      <i class="fas fa-chevron-right"></i>
    </button>
  `;

  paginationContainer.innerHTML = paginationHTML;
};

const changePage = (page) => {
  if (page < 1 || page > totalPages || page === currentPage) return;
  currentPage = page;
  renderAppointments();
  updatePagination();
};

const getPaginatedAppointments = () => {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return filteredAppointments.slice(startIndex, endIndex);
};

// ===== Authentication & API Functions =====
const getAuthHeaders = () => {
  const token = localStorage.getItem("authToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

const makeApiCall = async (endpoint, options = {}) => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = getAuthHeaders();

    const response = await fetch(url, {
      headers,
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

const checkAuthentication = () => {
  const token = localStorage.getItem("authToken");
  const user = localStorage.getItem("user");

  if (!token || !user) {
    window.location.href = "/login.html";
    return false;
  }

  try {
    const userData = JSON.parse(user);
    console.log("User data:", userData);
    console.log("User role:", userData.role);
    console.log("User hospital:", userData.hospitalName);

    if (userData.role !== "staff") {
      console.log("❌ User is not staff, redirecting to login");
      window.location.href = "/login.html";
      return false;
    }

    console.log("✅ Authentication successful");
    return true;
  } catch (error) {
    console.error("Error parsing user data:", error);
    window.location.href = "/login.html";
    return false;
  }
};

// ===== Load Appointments =====
const loadAppointments = async () => {
  console.log("🔍 Loading appointments...");
  console.log("Current filter:", currentFilter);

  try {
    const endpoint = `/appointments/hospital/all?${
      currentFilter !== "all" ? `status=${currentFilter}` : ""
    }`;
    console.log("API endpoint:", endpoint);

    const response = await makeApiCall(endpoint);
    console.log("API response:", response);

    allAppointments = response.data.appointments || [];
    filteredAppointments = [...allAppointments];

    console.log("All appointments:", allAppointments.length);
    console.log("Filtered appointments:", filteredAppointments.length);

    applyFilters();
    renderAppointments();
    updateFilterButtons();
    populateDepartmentFilter();
  } catch (error) {
    console.error("Error loading appointments:", error);
    showPopup("Failed to load appointments", "error");
  }
};

// ===== Render Appointments =====
const renderAppointments = () => {
  const paginatedAppointments = getPaginatedAppointments();

  if (filteredAppointments.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 2rem; color: #6b7280;">
          <h3>No appointments found</h3>
          <p>No appointments match your current filters.</p>
        </td>
      </tr>
    `;
    updatePagination();
    return;
  }

  tableBody.innerHTML = paginatedAppointments
    .map((appointment) => {
      const appointmentDate = new Date(appointment.appointmentDate);
      const formattedDate = appointmentDate.toLocaleDateString();

      // Use appointmentTime if available, otherwise format from appointmentDate
      let formattedTime;
      if (appointment.appointmentTime) {
        // appointmentTime is in format "HH:MM" (e.g., "07:12")
        const [hours, minutes] = appointment.appointmentTime.split(":");
        const timeDate = new Date();
        timeDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        formattedTime = timeDate.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      } else {
        formattedTime = appointmentDate.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      }

      const patientName =
        appointment.patientInfo?.fullName ||
        (appointment.patient
          ? `${appointment.patient.firstName} ${appointment.patient.lastName}`
          : "Unknown Patient");

      const statusColor = getStatusColor(appointment.status);
      const typeColor = getTypeColor(appointment.type);

      return `
        <tr data-appointment-id="${appointment._id}" style="cursor: pointer;">
          <td>${patientName}</td>
          <td>${appointment.specialty}</td>
          <td><span class="status" style="background-color: ${statusColor}; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">${
        appointment.status
      }</span></td>
          <td><span class="type" style="background-color: ${typeColor}; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">${
        appointment.type || "Visit"
      }</span></td>
          <td>${formattedDate} <br /><span>${formattedTime}</span></td>
        </tr>
      `;
    })
    .join("");

  // Add click event listeners to rows
  document.querySelectorAll("tbody tr[data-appointment-id]").forEach((row) => {
    row.addEventListener("click", () => {
      const appointmentId = row.dataset.appointmentId;
      const appointment = filteredAppointments.find(
        (apt) => apt._id === appointmentId
      );
      if (appointment) {
        showAppointmentDetails(appointment);
      }
    });
  });

  // Update pagination
  updatePagination();
};

// ===== Show Appointment Details =====
const showAppointmentDetails = (appointment) => {
  console.log("🔍 Showing appointment details for:", appointment);
  selectedAppointment = appointment;

  const appointmentDate = new Date(appointment.appointmentDate);
  const formattedDate = appointmentDate.toLocaleDateString();

  // Use appointmentTime if available, otherwise format from appointmentDate
  let formattedTime;
  if (appointment.appointmentTime) {
    // appointmentTime is in format "HH:MM" (e.g., "07:12")
    const [hours, minutes] = appointment.appointmentTime.split(":");
    const timeDate = new Date();
    timeDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    formattedTime = timeDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } else {
    formattedTime = appointmentDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  console.log("🕐 Time debugging:", {
    originalAppointmentDate: appointment.appointmentDate,
    appointmentTime: appointment.appointmentTime,
    parsedDate: appointmentDate,
    formattedTime: formattedTime,
    hour: appointmentDate.getHours(),
    minute: appointmentDate.getMinutes(),
  });

  const patientName =
    appointment.patientInfo?.fullName ||
    (appointment.patient
      ? `${appointment.patient.firstName} ${appointment.patient.lastName}`
      : "Unknown Patient");

  const patientPhone =
    appointment.patientInfo?.phoneNumber ||
    appointment.patientInfo?.phone ||
    appointment.patient?.phone ||
    "N/A";

  const patientEmail =
    appointment.patientInfo?.email || appointment.patient?.email || "N/A";

  console.log("👤 Patient details:", {
    name: patientName,
    phone: patientPhone,
    email: patientEmail,
    appointmentData: appointment,
  });

  profileSection.innerHTML = `
    <div class="pic-name">
      <div class="profile-name">
        <h2>${patientName}</h2>
        <p>${patientPhone}</p>
        <p>${patientEmail}</p>
      </div>
    </div>
    <div class="history">
      <h3>Appointment Details</h3>
      <p>Date: ${formattedDate}</p>
      <p>Time: ${formattedTime}</p>
      <p>Department: ${appointment.specialty}</p>
      <p>Status: ${appointment.status}</p>
      <p>Notes: ${appointment.notes || "No notes available"}</p>
    </div>
    <div class="notes">
      <h3>Patient Notes</h3>
      <p>${appointment.patientInfo?.notes || "No additional notes"}</p>
    </div>
    <div class="check-btn-profile">
      <div class="profile-button-1">
        ${
          appointment.status === "scheduled"
            ? `
          <button class="next pro-btn" onclick="handleAcceptAppointment('${appointment._id}')">Accept</button>
          <button class="prev pro-btn" onclick="handleRescheduleAppointment('${appointment._id}')">Reschedule</button>
        `
            : appointment.status === "confirmed"
            ? `
          <button class="next pro-btn" onclick="handleCheckIn('${appointment._id}')">Check-in</button>
          <button class="prev pro-btn" onclick="handleMoveToQueue('${appointment._id}')">Move to Queue</button>
        `
            : appointment.status === "checked-in"
            ? `
          <button class="next pro-btn" onclick="handleCompleteAppointment('${appointment._id}')">Complete</button>
          <button class="prev pro-btn" onclick="handleMoveToQueue('${appointment._id}')">Move to Queue</button>
        `
            : `
          <button class="next pro-btn" onclick="handleCheckIn('${appointment._id}')">Check-in</button>
          <button class="prev pro-btn" onclick="handleMoveToQueue('${appointment._id}')">Move to Queue</button>
        `
        }
      </div>
      <div class="profile-button">
        <button class="next pro-btn" onclick="handleMessage('${
          appointment._id
        }')">Message</button>
        <button class="prev pro-btn" onclick="handleEdit('${
          appointment._id
        }')">Edit</button>
      </div>
    </div>
  `;

  // Show the profile section
  const profileContainer = document.querySelector(".profile");
  if (profileContainer) {
    profileContainer.style.display = "block";
  }
};

// ===== Appointment Actions =====
const handleCheckIn = async (appointmentId) => {
  try {
    await makeApiCall(`/appointments/staff/${appointmentId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status: "checked-in" }),
    });

    showPopup("Patient checked in successfully", "success");
    loadAppointments();
  } catch (error) {
    console.error("Check-in error:", error);
    showPopup("Failed to check in patient", "error");
  }
};

const handleMoveToQueue = async (appointmentId) => {
  try {
    await makeApiCall(`/appointments/staff/${appointmentId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status: "in-queue" }),
    });

    showPopup("Patient moved to queue successfully", "success");
    loadAppointments();
  } catch (error) {
    console.error("Move to queue error:", error);
    showPopup("Failed to move patient to queue", "error");
  }
};

const handleAcceptAppointment = async (appointmentId) => {
  try {
    await makeApiCall(`/appointments/staff/${appointmentId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status: "confirmed" }),
    });

    showPopup("Appointment accepted successfully", "success");
    loadAppointments();
  } catch (error) {
    console.error("Accept appointment error:", error);
    showPopup("Failed to accept appointment", "error");
  }
};

const handleCompleteAppointment = async (appointmentId) => {
  try {
    await makeApiCall(`/appointments/staff/${appointmentId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status: "completed" }),
    });

    showPopup("Appointment completed successfully", "success");
    loadAppointments();
  } catch (error) {
    console.error("Complete appointment error:", error);
    showPopup("Failed to complete appointment", "error");
  }
};

const handleRescheduleAppointment = (appointmentId) => {
  const appointment = allAppointments.find((apt) => apt._id === appointmentId);
  if (!appointment) return;

  showRescheduleModal(appointment);
};

const showRescheduleModal = (appointment) => {
  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>Reschedule Appointment</h3>
        <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">×</button>
      </div>
      <form id="rescheduleForm">
        <div class="form-group">
          <label>Patient: ${
            appointment.patientInfo?.fullName ||
            appointment.patient?.firstName + " " + appointment.patient?.lastName
          }</label>
        </div>
        <div class="form-group">
          <label for="newDate">New Date:</label>
          <input type="date" id="newDate" required>
        </div>
        <div class="form-group">
          <label for="newTime">New Time:</label>
          <input type="time" id="newTime" required>
        </div>
        <div class="form-group">
          <label for="rescheduleReason">Reason for rescheduling:</label>
          <textarea id="rescheduleReason" rows="3" placeholder="Enter reason for rescheduling..."></textarea>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
          <button type="submit" class="btn-primary">Reschedule</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  // Set current date/time as default
  const currentDate = new Date(appointment.appointmentDate);
  document.getElementById("newDate").value = currentDate
    .toISOString()
    .split("T")[0];
  document.getElementById("newTime").value = currentDate
    .toTimeString()
    .slice(0, 5);

  document
    .getElementById("rescheduleForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      await handleRescheduleSubmit(appointment._id, modal);
    });
};

const handleRescheduleSubmit = async (appointmentId, modal) => {
  try {
    const newDate = document.getElementById("newDate").value;
    const newTime = document.getElementById("newTime").value;
    const reason = document.getElementById("rescheduleReason").value;

    const newDateTime = new Date(`${newDate}T${newTime}`);

    await makeApiCall(`/appointments/staff/${appointmentId}/reschedule`, {
      method: "PUT",
      body: JSON.stringify({
        appointmentDate: newDateTime.toISOString(),
        reason: reason,
      }),
    });

    showPopup("Appointment rescheduled successfully", "success");
    modal.remove();
    loadAppointments();
  } catch (error) {
    console.error("Reschedule error:", error);
    showPopup("Failed to reschedule appointment", "error");
  }
};

const handleMessage = (appointmentId) => {
  const appointment = allAppointments.find((apt) => apt._id === appointmentId);
  if (!appointment) return;

  showMessageModal(appointment);
};

const showMessageModal = (appointment) => {
  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>Send Message to Patient</h3>
        <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">×</button>
      </div>
      <form id="messageForm">
        <div class="form-group">
          <label>Patient: ${
            appointment.patientInfo?.fullName ||
            appointment.patient?.firstName + " " + appointment.patient?.lastName
          }</label>
        </div>
        <div class="form-group">
          <label>Appointment: ${appointment.specialty} - ${new Date(
    appointment.appointmentDate
  ).toLocaleDateString()}</label>
        </div>
        <div class="form-group">
          <label for="messageType">Message Type:</label>
          <select id="messageType" required>
            <option value="general">General Message</option>
            <option value="appointment_reminder">Appointment Reminder</option>
            <option value="status_update">Status Update</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        <div class="form-group">
          <label for="messagePriority">Priority:</label>
          <select id="messagePriority" required>
            <option value="low">Low</option>
            <option value="medium" selected>Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        <div class="form-group">
          <label for="messageText">Message:</label>
          <textarea id="messageText" rows="5" placeholder="Type your message here..." required maxlength="1000"></textarea>
          <small class="char-count">0/1000 characters</small>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
          <button type="submit" class="btn-primary">Send Message</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  // Character counter
  const messageText = document.getElementById("messageText");
  const charCount = document.querySelector(".char-count");

  messageText.addEventListener("input", () => {
    const count = messageText.value.length;
    charCount.textContent = `${count}/1000 characters`;
    if (count > 900) {
      charCount.style.color = "#ef4444";
    } else if (count > 700) {
      charCount.style.color = "#f59e0b";
    } else {
      charCount.style.color = "#6b7280";
    }
  });

  // Form submission
  document
    .getElementById("messageForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      await handleSendMessage(appointment._id, modal);
    });
};

const handleSendMessage = async (appointmentId, modal) => {
  try {
    const messageType = document.getElementById("messageType").value;
    const priority = document.getElementById("messagePriority").value;
    const message = document.getElementById("messageText").value;

    const messageData = {
      appointmentId,
      message,
      messageType,
      priority,
    };

    console.log("📤 Sending message:", messageData);

    await makeApiCall("/messages/send", {
      method: "POST",
      body: JSON.stringify(messageData),
    });

    showPopup("Message sent successfully", "success");
    modal.remove();
  } catch (error) {
    console.error("Send message error:", error);
    showPopup("Failed to send message", "error");
  }
};

const showEditModal = (appointment) => {
  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 600px;">
      <div class="modal-header">
        <h3>Edit Appointment Details</h3>
        <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">×</button>
      </div>
      <form id="editForm">
        <div class="form-group">
          <label>Patient: ${
            appointment.patientInfo?.fullName ||
            appointment.patient?.firstName + " " + appointment.patient?.lastName
          }</label>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="editDoctor">Doctor:</label>
            <input type="text" id="editDoctor" value="${
              appointment.doctor || ""
            }" required>
          </div>
          <div class="form-group">
            <label for="editSpecialty">Department:</label>
            <select id="editSpecialty" required>
              <option value="General Medicine" ${
                appointment.specialty === "General Medicine" ? "selected" : ""
              }>General Medicine</option>
              <option value="Cardiology" ${
                appointment.specialty === "Cardiology" ? "selected" : ""
              }>Cardiology</option>
              <option value="Dermatology" ${
                appointment.specialty === "Dermatology" ? "selected" : ""
              }>Dermatology</option>
              <option value="Neurology" ${
                appointment.specialty === "Neurology" ? "selected" : ""
              }>Neurology</option>
              <option value="Orthopedics" ${
                appointment.specialty === "Orthopedics" ? "selected" : ""
              }>Orthopedics</option>
              <option value="Pediatrics" ${
                appointment.specialty === "Pediatrics" ? "selected" : ""
              }>Pediatrics</option>
              <option value="Surgery" ${
                appointment.specialty === "Surgery" ? "selected" : ""
              }>Surgery</option>
              <option value="Emergency" ${
                appointment.specialty === "Emergency" ? "selected" : ""
              }>Emergency</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="editDate">Date:</label>
            <input type="date" id="editDate" required>
          </div>
          <div class="form-group">
            <label for="editTime">Time:</label>
            <input type="time" id="editTime" required>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="editType">Type:</label>
            <select id="editType" required>
              <option value="consultation" ${
                appointment.type === "consultation" ? "selected" : ""
              }>Consultation</option>
              <option value="follow-up" ${
                appointment.type === "follow-up" ? "selected" : ""
              }>Follow-up</option>
              <option value="emergency" ${
                appointment.type === "emergency" ? "selected" : ""
              }>Emergency</option>
              <option value="routine" ${
                appointment.type === "routine" ? "selected" : ""
              }>Routine</option>
              <option value="specialist" ${
                appointment.type === "specialist" ? "selected" : ""
              }>Specialist</option>
              <option value="general" ${
                appointment.type === "general" ? "selected" : ""
              }>General</option>
            </select>
          </div>
          <div class="form-group">
            <label for="editStatus">Status:</label>
            <select id="editStatus" required>
              <option value="scheduled" ${
                appointment.status === "scheduled" ? "selected" : ""
              }>Scheduled</option>
              <option value="confirmed" ${
                appointment.status === "confirmed" ? "selected" : ""
              }>Confirmed</option>
              <option value="checked-in" ${
                appointment.status === "checked-in" ? "selected" : ""
              }>Checked-in</option>
              <option value="completed" ${
                appointment.status === "completed" ? "selected" : ""
              }>Completed</option>
              <option value="cancelled" ${
                appointment.status === "cancelled" ? "selected" : ""
              }>Cancelled</option>
              <option value="no-show" ${
                appointment.status === "no-show" ? "selected" : ""
              }>No-show</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label for="editNotes">Notes:</label>
          <textarea id="editNotes" rows="3" placeholder="Add appointment notes...">${
            appointment.notes || ""
          }</textarea>
        </div>

        <div class="form-group">
          <label>Patient Information:</label>
          <div class="form-row">
            <div class="form-group">
              <label for="editPatientName">Full Name:</label>
              <input type="text" id="editPatientName" value="${
                appointment.patientInfo?.fullName || ""
              }">
            </div>
            <div class="form-group">
              <label for="editPatientPhone">Phone:</label>
              <input type="tel" id="editPatientPhone" value="${
                appointment.patientInfo?.phoneNumber || ""
              }">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="editPatientEmail">Email:</label>
              <input type="email" id="editPatientEmail" value="${
                appointment.patientInfo?.email || ""
              }">
            </div>
            <div class="form-group">
              <label for="editPatientGender">Gender:</label>
              <select id="editPatientGender">
                <option value="male" ${
                  appointment.patientInfo?.gender === "male" ? "selected" : ""
                }>Male</option>
                <option value="female" ${
                  appointment.patientInfo?.gender === "female" ? "selected" : ""
                }>Female</option>
                <option value="other" ${
                  appointment.patientInfo?.gender === "other" ? "selected" : ""
                }>Other</option>
                <option value="prefer-not-to-say" ${
                  appointment.patientInfo?.gender === "prefer-not-to-say"
                    ? "selected"
                    : ""
                }>Prefer not to say</option>
              </select>
            </div>
            <div class="form-group">
              <label for="editPatientDateOfBirth">Date of Birth:</label>
              <input type="date" id="editPatientDateOfBirth" value="${
                appointment.patientInfo?.dateOfBirth
                  ? new Date(appointment.patientInfo.dateOfBirth)
                      .toISOString()
                      .split("T")[0]
                  : ""
              }">
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
          <button type="submit" class="btn-primary">Save Changes</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  // Set current values
  const appointmentDate = new Date(appointment.appointmentDate);
  document.getElementById("editDate").value = appointmentDate
    .toISOString()
    .split("T")[0];
  document.getElementById("editTime").value =
    appointment.appointmentTime || appointmentDate.toTimeString().slice(0, 5);

  // Form submission
  document.getElementById("editForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    await handleEditSubmit(appointment._id, modal);
  });
};

const handleEditSubmit = async (appointmentId, modal) => {
  try {
    const editData = {
      doctor: document.getElementById("editDoctor").value,
      specialty: document.getElementById("editSpecialty").value,
      appointmentDate: document.getElementById("editDate").value,
      appointmentTime: document.getElementById("editTime").value,
      type: document.getElementById("editType").value,
      status: document.getElementById("editStatus").value,
      notes: document.getElementById("editNotes").value,
      patientInfo: {
        fullName: document.getElementById("editPatientName").value,
        phoneNumber: document.getElementById("editPatientPhone").value,
        email: document.getElementById("editPatientEmail").value,
        gender: document.getElementById("editPatientGender").value,
        dateOfBirth: document.getElementById("editPatientDateOfBirth").value,
      },
    };

    console.log("✏️ Editing appointment:", editData);

    const response = await makeApiCall(
      `/appointments/staff/${appointmentId}/edit`,
      {
        method: "PUT",
        body: JSON.stringify(editData),
      }
    );

    showPopup("Appointment updated successfully", "success");
    modal.remove();
    loadAppointments();
  } catch (error) {
    console.error("Edit appointment error:", error);
    showPopup("Failed to update appointment", "error");
  }
};

const handleEdit = (appointmentId) => {
  const appointment = allAppointments.find((apt) => apt._id === appointmentId);
  if (!appointment) return;

  showEditModal(appointment);
};

// ===== Filter Functions =====
const updateFilterButtons = () => {
  document.querySelectorAll(".slt-btn button").forEach((btn) => {
    btn.classList.remove("active");
    btn.classList.add("inactive-btn");
  });

  const activeButton = document.querySelector(
    `.slt-btn button.${currentFilter}-btn`
  );
  if (activeButton) {
    activeButton.classList.add("active");
    activeButton.classList.remove("inactive-btn");
  }
};

const applyFilter = (filter) => {
  console.log("🔄 Applying filter:", filter);
  currentFilter = filter;
  applyFilters();
  renderAppointments();
  updateFilterButtons();
};

// ===== Date Range Functions =====
const applyDateFilter = () => {
  const startDate = document.getElementById("startDate");
  const endDate = document.getElementById("endDate");
  const currentDate = document.querySelector(".current-date");
  const dateMeter = document.querySelector(".date-meter");

  if (startDate.value && endDate.value) {
    selectedDateRange.start = startDate.value;
    selectedDateRange.end = endDate.value;
    currentDate.textContent = `${startDate.value} → ${endDate.value}`;
  } else {
    selectedDateRange.start = "";
    selectedDateRange.end = "";
    currentDate.textContent = "Date Range";
  }

  applyFilters();
  renderAppointments();
  dateMeter.classList.remove("open");
};

const clearDateFilter = () => {
  const startDate = document.getElementById("startDate");
  const endDate = document.getElementById("endDate");
  const currentDate = document.querySelector(".current-date");

  startDate.value = "";
  endDate.value = "";
  selectedDateRange.start = "";
  selectedDateRange.end = "";
  currentDate.textContent = "Date Range";
  applyFilters();
  renderAppointments();
};

// ===== Department Filter =====
const populateDepartmentFilter = () => {
  console.log("🏥 Populating department filter...");
  const departments = [...new Set(allAppointments.map((apt) => apt.specialty))];
  console.log("📋 Available departments:", departments);
  const deptContent = document.querySelector(".dept-dropdown-content");
  const deptDropdown = document.querySelector(".dept-dropdown");

  if (!deptContent) {
    console.error("🏥 Department dropdown content not found!");
    return;
  }

  if (!deptDropdown) {
    console.error("🏥 Department dropdown not found!");
    return;
  }

  deptContent.innerHTML = `
    <li data-dept="">All Departments</li>
    ${departments
      .map((dept) => `<li data-dept="${dept}">${dept}</li>`)
      .join("")}
  `;

  // Add event listeners
  deptContent.querySelectorAll("li").forEach((item) => {
    item.addEventListener("click", () => {
      const deptBtn = document.querySelector(".dept-btn");
      deptBtn.textContent = item.textContent;
      deptDropdown.classList.remove("open");

      // Apply department filter
      selectedDepartment = item.dataset.dept;
      console.log("🏥 Department filter selected:", selectedDepartment);
      applyFilters();
      renderAppointments();
    });
  });
};

// ===== Search Function =====
const setupSearch = () => {
  console.log("🔍 Setting up search...");
  const searchInput = document.querySelector(".search-bar input");
  console.log("🔍 Search input found:", !!searchInput);
  if (!searchInput) {
    console.log("🔍 Adding search input...");
    // Add search input if it doesn't exist
    const searchBar = document.querySelector(".search-bar");
    searchBar.innerHTML = `
      <input type="text" placeholder="Search appointments..." style="border: none; outline: none; padding: 8px; width: 200px;">
      <button class="src-icon">
        <span class="material-symbols-outlined search-icon">search</span>
      </button>
    `;
  }

  const searchInputElement = document.querySelector(".search-bar input");
  if (searchInputElement) {
    searchInputElement.addEventListener("input", (e) => {
      const searchTerm = e.target.value.toLowerCase();
      if (searchTerm) {
        // Apply search filter on top of existing filters
        const baseFiltered = [...filteredAppointments];
        filteredAppointments = baseFiltered.filter((appointment) => {
          const patientName =
            appointment.patientInfo?.fullName ||
            (appointment.patient
              ? `${appointment.patient.firstName} ${appointment.patient.lastName}`
              : ""
            ).toLowerCase();
          const specialty = appointment.specialty.toLowerCase();

          return (
            patientName.includes(searchTerm) || specialty.includes(searchTerm)
          );
        });
      } else {
        // Reset to base filtered results
        applyFilters();
      }
      renderAppointments();
    });
  }
};

// ===== Modal Functions =====
const showNewAppointmentModal = () => {
  modal.style.display = "block";
};

const hideNewAppointmentModal = () => {
  modal.style.display = "none";
  apptForm.reset();
};

const handleNewAppointment = async (e) => {
  e.preventDefault();

  // Combine date and time into a single datetime string
  const dateValue = document.getElementById("appointmentDate").value;
  const timeValue = document.getElementById("appointmentTime").value;
  const combinedDateTime = `${dateValue}T${timeValue}:00`;

  const appointmentData = {
    doctor: "General Practitioner", // Default doctor for all appointments
    specialty: document.getElementById("department").value,
    appointmentDate: combinedDateTime,
    appointmentTime: document.getElementById("appointmentTime").value,
    type: document.getElementById("type").value,
    notes: document.getElementById("notes").value,
    patientInfo: {
      fullName: document.getElementById("patientName").value,
      phoneNumber: document.getElementById("patientPhone").value,
      email: document.getElementById("patientEmail").value,
      gender: "prefer-not-to-say", // Default gender
      dateOfBirth: new Date().toISOString(), // Default date of birth
    },
  };

  console.log("📝 Creating appointment with data:", appointmentData);

  try {
    await makeApiCall("/appointments/staff/create", {
      method: "POST",
      body: JSON.stringify(appointmentData),
    });

    showPopup("Appointment created successfully", "success");
    hideNewAppointmentModal();
    loadAppointments();
    // Refresh department filter after creating new appointment
    setTimeout(() => {
      populateDepartmentFilter();
    }, 500);
  } catch (error) {
    console.error("Error creating appointment:", error);
    showPopup("Failed to create appointment", "error");
  }
};

// ===== Popup Functions =====
const showPopup = (message, type = "info") => {
  // Create popup element
  const popup = document.createElement("div");
  popup.className = `popup popup-${type}`;
  popup.innerHTML = `
    <div class="popup-content">
      <span class="popup-message">${message}</span>
      <button class="popup-close" onclick="this.parentElement.parentElement.remove()">×</button>
    </div>
  `;

  // Add to page
  document.body.appendChild(popup);

  // Auto remove after 3 seconds
  setTimeout(() => {
    if (popup.parentElement) {
      popup.remove();
    }
  }, 3000);
};

// ===== Initialize =====
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 Initializing appointments page...");
  checkAuthentication();
  loadAppointments();
  setupSearch();

  // Filter buttons
  document.querySelectorAll(".slt-btn button").forEach((btn) => {
    btn.addEventListener("click", () => {
      // Get the filter name from the button's class that ends with "-btn"
      const filterClass = Array.from(btn.classList).find((cls) =>
        cls.endsWith("-btn")
      );
      const filter = filterClass ? filterClass.replace("-btn", "") : "all";
      console.log(
        "🔍 Filter button clicked:",
        filter,
        "from class:",
        filterClass
      );
      applyFilter(filter);
    });
  });

  // Date range
  const dateMeter = document.querySelector(".date-meter");
  const applyBtn = document.querySelector(".apply-btn");
  const clearBtn = document.querySelector(".clear-btn");

  console.log("📅 Date range elements found:", {
    dateMeter: !!dateMeter,
    applyBtn: !!applyBtn,
    clearBtn: !!clearBtn,
  });

  if (dateMeter) {
    dateMeter.addEventListener("click", () => {
      console.log("📅 Date meter clicked");
      dateMeter.classList.toggle("open");
    });
  }

  if (applyBtn) {
    applyBtn.addEventListener("click", () => {
      console.log("📅 Apply date filter clicked");
      applyDateFilter();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      console.log("📅 Clear date filter clicked");
      clearDateFilter();
    });
  }

  // Department dropdown
  const deptDropdown = document.querySelector(".dept-dropdown");
  const deptBtn = deptDropdown?.querySelector(".dept-btn");

  console.log("🏥 Department dropdown elements found:", {
    deptDropdown: !!deptDropdown,
    deptBtn: !!deptBtn,
  });

  if (deptBtn) {
    deptBtn.addEventListener("click", () => {
      console.log("🏥 Department dropdown clicked");
      deptDropdown.classList.toggle("open");
    });
  }

  // Modal
  newApptBtn.addEventListener("click", showNewAppointmentModal);
  closeBtn.addEventListener("click", hideNewAppointmentModal);
  apptForm.addEventListener("submit", handleNewAppointment);

  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      hideNewAppointmentModal();
    }
  });

  // Populate department filter after a short delay
  setTimeout(() => {
    populateDepartmentFilter();
  }, 1000);
});

// ===== Global Functions for onclick handlers =====
window.handleCheckIn = handleCheckIn;
window.handleMoveToQueue = handleMoveToQueue;
window.handleMessage = handleMessage;
window.handleEdit = handleEdit;
window.handleAcceptAppointment = handleAcceptAppointment;
window.handleCompleteAppointment = handleCompleteAppointment;
window.handleRescheduleAppointment = handleRescheduleAppointment;
window.changePage = changePage;
