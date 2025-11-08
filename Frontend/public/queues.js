"use strict";
const wrapper = document.getElementById("dateMeter");
const button = document.querySelector(".date-btn");
const menu = document.getElementById("menu");
const label = document.getElementById("current-date");
const startEl = document.getElementById("start-date");
const endEl = document.getElementById("end-date");
const apply = document.getElementById("applyBtn");
const clear = document.getElementById("clearBtn");
const tableBody = document.getElementById("queueTableBody");
let checkboxes = document.querySelectorAll(
  ".list-table tbody input[type='checkbox']"
);
const profileSection = document.querySelector(".profile-details");
const nextBtn = document.querySelector(".profile-button .next");
const prevBtn = document.querySelector(".profile-button .prev");
const dropdownToggle = document.querySelectorAll(".dropdown-toggle");
const liContent = document.querySelectorAll(".dropdown-content li");

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

// ===== Dropdown Logic =====
// Handle dropdown toggle
const dropdownToggles = document.querySelectorAll(
  ".hosp-dropdown-toggle, .dept-dropdown-toggle"
);

dropdownToggles.forEach((toggle) => {
  toggle.addEventListener("click", function () {
    const dropdown = this.parentElement;
    dropdown.classList.toggle("open");

    // Close other dropdowns
    document.querySelectorAll(".dropdown").forEach((d) => {
      if (d !== dropdown) d.classList.remove("open");
    });
  });
});

// Handle option select
const dropdownItems = document.querySelectorAll(".dropdown-content li");

dropdownItems.forEach((item) => {
  item.addEventListener("click", function () {
    const dropdown = this.closest(".dropdown");
    const button = dropdown.querySelector(".btn");
    button.textContent = this.textContent;
    dropdown.classList.remove("open");
  });
});

let selectedPatients = []; // history of checked patients
let currentIndex = -1;
let allQueues = [];
let filteredQueues = [];
let currentPage = 1;
const PAGE_SIZE = 10;
const statsText = document.getElementById("queueStatsText");

const patientData = {
  "Abel Johnson": {
    history: [
      "Visit 1: Jan 15, 2023",
      "Visit 2: Mar 10, 2023",
      "Visit 3: Jul 2, 2023",
    ],
    notes: "Patient has mild asthma and uses inhaler occasionally.",
  },
  "Alex Martins": {
    history: ["Visit 1: Feb 8, 2023", "Visit 2: May 18, 2023"],
    notes: "Recovering from knee surgery, follow-up in 2 weeks.",
  },
  "Jane Andrey": {
    history: [
      "Visit 1: Feb 11, 2023",
      "Visit 2: May 8, 2023",
      "Visit 3: Aug 15, 2023",
      "Visit 4: Dec 22, 2023",
    ],
    notes: "Allergic to penicillin, monitor during prescriptions.",
  },
  "Emily Jordan": {
    history: ["Visit 1: Mar 3, 2023", "Visit 2: Jun 25, 2023"],
    notes: "Patient reports frequent migraines, advised neurology consult.",
  },
  "Steven Banks": {
    history: ["Visit 1: Apr 19, 2023", "Visit 2: Aug 11, 2023"],
    notes: "Hypertension under observation, continues medication.",
  },
  "Mya Smith": {
    history: [
      "Visit 1: Jan 29, 2023",
      "Visit 2: Apr 5, 2023",
      "Visit 3: Jul 12, 2023",
      "Visit 4: Oct 14, 2023",
      "Visit 5: Dec 8, 2023",
    ],
    notes: "Regular check-ups for diabetes management.",
  },
  "Ruth Patrick": {
    history: ["Visit 1: May 7, 2023", "Visit 2: Jul 30, 2023"],
    notes: "Patient is undergoing physical therapy after accident.",
  },
  "Paul Adams": {
    history: ["Visit 1: Feb 20, 2023", "Visit 2: Sep 12, 2023"],
    notes: "Admitted for appendicitis surgery, recovering well.",
  },
  "James Daniel": {
    history: ["Visit 1: Mar 17, 2023", "Visit 2: Nov 2, 2023"],
    notes: "High cholesterol, on prescribed diet and medication.",
  },
  "Bello George": {
    history: ["Visit 1: Jan 9, 2023", "Visit 2: May 25, 2023"],
    notes: "Fractured wrist last year, currently fully healed.",
  },
};

// Update profile UI
// function updateProfile(row) {
//   const name = row.querySelector(".name").innerText.trim();
//   const img = row.querySelector(".name img").src;
//   const status = row.querySelector("td:nth-child(4) .status").innerText;
//   const ticket = row.querySelector("td:nth-child(3)").innerText;
//   const room = row.querySelector("td:nth-child(6)").innerText;

//   profileSection.innerHTML = `
//     <div class="pic-name">
//       <div class="prof-pic">
//         <img src="${img}" alt="${name}-profile-pic" />
//       </div>
//       <div class="profile-name">
//         <h2>${name}</h2>
//         <p>Ticket: ${ticket}</p>
//         <p>Status: ${status}</p>
//         <p>Room: ${room}</p>
//       </div>
//     </div>
//     <div class="history">
//       <h3>Queue History</h3>
//       <p>Visit 1: Feb, 11 2023</p>
//       <p>Visit 2: May, 8 2023</p>
//     </div>
//     <div class="notes">
//       <h3>Notes</h3>
//       <p>Patient details updated dynamically</p>
//     </div>
//   `;
// }

function updateProfile(row) {
  const name = row.querySelector(".name").innerText.trim();
  const status = row.querySelector("td:nth-child(4) .status").innerText;
  const ticket = row.querySelector("td:nth-child(3)").innerText;
  const room = row.querySelector("td:nth-child(6)").innerText;

  const fullHistory = patientData[name]?.history || ["No previous visits"];
  const notes = patientData[name]?.notes || "No notes available";

  // Show only the last 2 queue history entries
  const recentHistory = fullHistory.slice(-2);

  profileSection.innerHTML = `
    <div class="pic-name">
      <div class="prof-pic">
        <i class="fa-solid fa-user"></i>
      </div>
      <div class="profile-name">
        <h2>${name}</h2>
        <p>Ticket: ${ticket}</p>
        <p>Status: ${status}</p>
        <p>Room: ${room}</p>
      </div>
    </div>
    <div class="history">
      <h3>Queue History</h3>
      ${recentHistory.map((h) => `<p>${h}</p>`).join("")}
    </div>
    <div class="notes">
      <h3>Notes</h3>
      <p>${notes}</p>
    </div>
  `;

  // Show the profile section when a patient is selected
  const profileContainer = document.querySelector(".profile");
  if (profileContainer) {
    profileContainer.style.display = "block";
  }
}

// Function to hide profile section when no patient is selected
function hideProfile() {
  const profileContainer = document.querySelector(".profile");
  if (profileContainer) {
    profileContainer.style.display = "none";
  }
}

// Handle checkbox selection
function wireCheckboxHandlers() {
  checkboxes = document.querySelectorAll(
    ".list-table tbody input[type='checkbox']"
  );
  checkboxes.forEach((cb, index) => {
    cb.addEventListener("change", function () {
      if (this.checked) {
        checkboxes.forEach((other) => {
          if (other !== this) other.checked = false;
        });

        const row = this.closest("tr");
        updateProfile(row);

        // Add to history
        const rowId = index; // row index
        if (!selectedPatients.includes(rowId)) {
          selectedPatients.push(rowId);
        }
        currentIndex = selectedPatients.indexOf(rowId);
      } else {
        // Check if no checkboxes are selected
        const anyChecked = Array.from(checkboxes).some((cb) => cb.checked);
        if (!anyChecked) {
          hideProfile();
        }
      }
    });
  });
}

// Next button
nextBtn.addEventListener("click", () => {
  if (currentIndex < selectedPatients.length - 1) {
    currentIndex++;
    const rowIndex = selectedPatients[currentIndex];
    const row = checkboxes[rowIndex].closest("tr");
    checkboxes.forEach((cb) => (cb.checked = false));
    checkboxes[rowIndex].checked = true;
    updateProfile(row);
  }
});

// Previous button
prevBtn.addEventListener("click", () => {
  if (currentIndex > 0) {
    currentIndex--;
    const rowIndex = selectedPatients[currentIndex];
    const row = checkboxes[rowIndex].closest("tr");
    checkboxes.forEach((cb) => (cb.checked = false));
    checkboxes[rowIndex].checked = true;
    updateProfile(row);
  }
});

// Close dropdowns when clicking outside
document.addEventListener("click", function (e) {
  if (!e.target.closest(".dropdown")) {
    document
      .querySelectorAll(".dropdown")
      .forEach((d) => d.classList.remove("open"));
  }
});

// ===== Queue Data (from API) =====
const searchInput = document.querySelector(".search-input");
const paginationPrev = document.querySelector(".pagination .prev");
const paginationNext = document.querySelector(".pagination .next");

// Add patient to queue
function paginate(data, page, pageSize) {
  const start = (page - 1) * pageSize;
  return data.slice(start, start + pageSize);
}

function renderTable(rows) {
  tableBody.innerHTML = rows
    .map((q) => {
      const statusClass =
        q.status === "waiting"
          ? "waiting"
          : q.status === "called"
          ? "in-progress"
          : q.status === "served"
          ? "complete"
          : "no_show";
      const patientName =
        q.patientName ||
        (q.patient
          ? `${q.patient.firstName} ${q.patient.lastName}`
          : "Unknown");
      const ticket = q.queueNumber || "-";
      const type = q.specialty || "-";
      const assignedRoom = q.assignedRoom
        ? `${q.assignedRoom.name}${
            q.assignedRoom.floor ? ` (${q.assignedRoom.floor})` : ""
          }`
        : "-";
      return `
        <tr data-queue-id="${q.id || q._id}">
          <td><input type="checkbox" data-queue-id="${q.id || q._id}" /></td>
          <td>
            <div class="name">
              <i class="fa-solid fa-user"></i>
              ${patientName}
            </div>
          </td>
          <td>${ticket}</td>
          <td><span class="status ${statusClass}">${q.status}</span></td>
          <td>${type ? "Out" : "-"}</td>
          <td>${assignedRoom}</td>
          <td class="action">
            <i class="fa-solid fa-phone call-patient-btn" data-queue-id="${
              q.id || q._id
            }" data-patient-name="${patientName}" data-ticket="${ticket}" title="Call Patient"></i>
            <i class="fa-solid fa-envelope" title="Send Message"></i>
            <i class="fa-solid fa-check complete-patient-btn" data-queue-id="${
              q.id || q._id
            }" data-patient-name="${patientName}" data-ticket="${ticket}" title="Mark as Complete"></i>
          </td>
        </tr>`;
    })
    .join("");
  wireCheckboxHandlers();
  wireActionButtonHandlers();
}

function wireActionButtonHandlers() {
  // Wire individual call patient buttons
  document.querySelectorAll(".call-patient-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const queueId = btn.dataset.queueId;
      const patientName = btn.dataset.patientName;
      const ticket = btn.dataset.ticket;

      console.log("Call button clicked:", {
        queueId,
        patientName,
        ticket,
        buttonElement: btn,
      });

      handleCallIndividualPatient(queueId, patientName, ticket);
    });
  });

  // Wire individual complete patient buttons
  document.querySelectorAll(".complete-patient-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const queueId = btn.dataset.queueId;
      const patientName = btn.dataset.patientName;
      const ticket = btn.dataset.ticket;

      console.log("Complete button clicked:", {
        queueId,
        patientName,
        ticket,
        buttonElement: btn,
      });

      handleCompleteIndividualPatient(queueId, patientName, ticket);
    });
  });
}

function applySearch() {
  const term = (searchInput?.value || "").toLowerCase();
  filteredQueues = allQueues.filter((q) => {
    const name = (q.patientName || "").toLowerCase();
    const ticket = (q.queueNumber || "").toLowerCase();
    return name.includes(term) || ticket.includes(term);
  });
  currentPage = 1;
  renderPage();
}

function renderPage() {
  const pageRows = paginate(filteredQueues, currentPage, PAGE_SIZE);
  renderTable(pageRows);
  const waiting = allQueues.filter((q) => q.status === "waiting").length;
  const called = allQueues.filter((q) => q.status === "called").length;
  const served = allQueues.filter((q) => q.status === "served").length;
  if (statsText) {
    const total = allQueues.length;
    statsText.textContent = `${waiting} waiting, ${called} in progress, ${served} completed · total ${total}`;
  }
}

async function loadMyHospitalQueues() {
  const token = localStorage.getItem("authToken");
  if (!token) return;
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const role = user?.role;

  if (role === "patient") {
    const statusRes = await fetch(
      "https://qure-design.onrender.com/api/queues/status",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (statusRes.ok) {
      const statusData = await statusRes.json();
      const q = statusData.data || {};
      const normalized = {
        id: q._id,
        queueNumber: q.queueNumber,
        position: q.position,
        specialty: q.specialty,
        hospitalName: q.hospitalName,
        status: q.status,
        estimatedWaitTime: q.estimatedWaitTime,
        joinedAt: q.createdAt,
        patientName: q.patient
          ? `${q.patient.firstName} ${q.patient.lastName}`
          : `${user?.firstName || ""} ${user?.lastName || ""}`,
      };
      allQueues = [normalized];
    } else {
      allQueues = [];
    }
  } else if (role === "staff") {
    const hosp =
      user?.hospitalName || localStorage.getItem("lastHospitalName") || "";
    if (hosp) {
      const res = await fetch(
        `https://qure-design.onrender.com/api/queues/hospital?hospitalName=${encodeURIComponent(
          hosp
        )}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        allQueues = Array.isArray(data.data) ? data.data : [];
      } else {
        allQueues = [];
      }
    } else {
      allQueues = [];
    }
  } else {
    allQueues = [];
  }

  filteredQueues = allQueues.slice();
  renderPage();
}

searchInput?.addEventListener("input", applySearch);
paginationPrev?.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    renderPage();
  }
});
paginationNext?.addEventListener("click", () => {
  const totalPages = Math.max(1, Math.ceil(filteredQueues.length / PAGE_SIZE));
  if (currentPage < totalPages) {
    currentPage++;
    renderPage();
  }
});

// Action button handlers
function handleCallNext() {
  const token = localStorage.getItem("authToken");
  if (!token) {
    showPopup("Please log in to call next patient", "error");
    return;
  }

  const user = JSON.parse(localStorage.getItem("user") || "null");
  if (user?.role !== "staff") {
    showPopup("Only staff can call next patient", "error");
    return;
  }

  const hospitalName =
    user?.hospitalName || localStorage.getItem("lastHospitalName");
  if (!hospitalName) {
    showPopup("Hospital information not found", "error");
    return;
  }

  // Find the first waiting patient
  const waitingPatient = allQueues.find((q) => q.status === "waiting");
  if (!waitingPatient) {
    showPopup("No patients waiting in queue", "warning");
    return;
  }

  fetch("https://qure-design.onrender.com/api/queues/call-next", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      hospitalName: hospitalName,
      specialty: waitingPatient.specialty,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        showPopup(
          `Called ${data.data.patientName} (Queue #${data.data.queueNumber})`,
          "success"
        );
        loadMyHospitalQueues(); // Refresh the queue
      } else {
        showPopup(`Error: ${data.message}`, "error");
      }
    })
    .catch((error) => {
      console.error("Call next error:", error);
      showPopup("Failed to call next patient", "error");
    });
}

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
        loadMyHospitalQueues(); // Refresh the queue
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
        loadMyHospitalQueues(); // Refresh the queue
      } else {
        showPopup(`Error: ${data.message}`, "error");
      }
    })
    .catch((error) => {
      console.error("Complete individual patient error:", error);
      showPopup("Failed to complete patient", "error");
    });
}

function handleNotifySelected() {
  const selectedCheckboxes = document.querySelectorAll(
    '.list-table tbody input[type="checkbox"]:checked'
  );
  if (selectedCheckboxes.length === 0) {
    showPopup("Please select patients to notify", "warning");
    return;
  }

  const selectedPatients = Array.from(selectedCheckboxes).map((cb) => {
    const row = cb.closest("tr");
    const name = row.querySelector(".name").innerText.trim();
    const ticket = row.querySelector("td:nth-child(3)").innerText;
    const queueId = row.dataset.queueId || cb.dataset.queueId;
    return { name, ticket, queueId };
  });

  // Show notification modal with priority dropdown
  showNotificationModal(selectedPatients, selectedCheckboxes);
}

function showNotificationModal(selectedPatients, selectedCheckboxes) {
  const modal = document.createElement("div");
  modal.className = "popup-modal";
  modal.innerHTML = `
    <div class="popup-content">
      <div class="popup-header">
        <h3>Send Notification</h3>
        <button class="popup-close">&times;</button>
      </div>
      <div class="popup-body">
        <p>Send notification to <strong>${
          selectedPatients.length
        }</strong> selected patients:</p>
        <div class="patient-list">
          ${selectedPatients
            .map(
              (p) => `<div class="patient-item">• ${p.name} (${p.ticket})</div>`
            )
            .join("")}
        </div>
        
        <div class="form-group">
          <label for="priority-select">Priority:</label>
          <select id="priority-select" class="form-control">
            <option value="low">Low Priority</option>
            <option value="medium" selected>Medium Priority</option>
            <option value="high">High Priority</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="message-textarea">Message:</label>
          <textarea id="message-textarea" class="form-control" rows="4" placeholder="Enter your notification message..."></textarea>
        </div>
      </div>
      <div class="popup-footer">
        <button class="btn btn-secondary popup-cancel">Cancel</button>
        <button class="btn btn-primary popup-send">Send Notification</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Close modal handlers
  const closeModal = () => {
    document.body.removeChild(modal);
  };

  modal.querySelector(".popup-close").onclick = closeModal;
  modal.querySelector(".popup-cancel").onclick = closeModal;
  modal.onclick = (e) => {
    if (e.target === modal) closeModal();
  };

  // Send notification handler
  modal.querySelector(".popup-send").onclick = () => {
    const priority = modal.querySelector("#priority-select").value;
    const message = modal.querySelector("#message-textarea").value.trim();

    if (!message) {
      showPopup("Please enter a notification message", "warning");
      return;
    }

    closeModal();
    sendNotification(selectedPatients, message, priority, selectedCheckboxes);
  };
}

function sendNotification(
  selectedPatients,
  message,
  priority,
  selectedCheckboxes
) {
  const token = localStorage.getItem("authToken");
  if (!token) {
    showPopup("Please log in to send notifications", "error");
    return;
  }

  // Get patient IDs from the queue data
  const patientIds = selectedPatients
    .map((p) => {
      const queueItem = allQueues.find((q) => q.queueNumber === p.ticket);
      return queueItem?.patient?._id || queueItem?.patient;
    })
    .filter((id) => id);

  if (patientIds.length === 0) {
    showPopup("Could not find patient IDs for notification", "error");
    return;
  }

  fetch("https://qure-design.onrender.com/api/queues/notify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      patientIds: patientIds,
      message: message,
      priority: priority,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        showPopup(
          `Notifications sent to ${data.data.notifiedCount} patients with ${priority} priority`,
          "success"
        );
        // Uncheck all selected checkboxes
        selectedCheckboxes.forEach((cb) => (cb.checked = false));
        // Hide profile since no patients are selected
        hideProfile();
      } else {
        showPopup(`Error: ${data.message}`, "error");
      }
    })
    .catch((error) => {
      console.error("Notify error:", error);
      showPopup("Failed to send notifications", "error");
    });
}

function handleAssignRoom() {
  const selectedCheckboxes = document.querySelectorAll(
    '.list-table tbody input[type="checkbox"]:checked'
  );
  if (selectedCheckboxes.length === 0) {
    showPopup("Please select patients to assign room", "warning");
    return;
  }

  const selectedPatients = Array.from(selectedCheckboxes).map((cb) => {
    const row = cb.closest("tr");
    const name = row.querySelector(".name").innerText.trim();
    const ticket = row.querySelector("td:nth-child(3)").innerText;
    return { name, ticket };
  });

  showAssignRoomModal(selectedPatients, selectedCheckboxes);
}

async function showAssignRoomModal(selectedPatients, selectedCheckboxes) {
  // First, load available waiting rooms
  const token = localStorage.getItem("authToken");
  if (!token) {
    showPopup("Please log in to assign rooms", "error");
    return;
  }

  try {
    const response = await fetch(
      "https://qure-design.onrender.com/api/waiting-rooms",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to load waiting rooms");
    }

    const data = await response.json();
    const waitingRooms = data.data || [];

    const modal = document.createElement("div");
    modal.className = "popup-modal";
    modal.innerHTML = `
      <div class="popup-content">
        <div class="popup-header">
          <h3>Assign Room</h3>
          <button class="popup-close">&times;</button>
        </div>
        <div class="popup-body">
          <p>Assign <strong>${
            selectedPatients.length
          }</strong> selected patients to a waiting room:</p>
          <div class="patient-list">
            ${selectedPatients
              .map(
                (p) =>
                  `<div class="patient-item">• ${p.name} (${p.ticket})</div>`
              )
              .join("")}
          </div>
          
          <div class="form-group">
            <label for="room-select">Select Waiting Room:</label>
            <select id="room-select" class="form-control">
              <option value="">Choose a waiting room...</option>
              ${waitingRooms
                .map(
                  (room) =>
                    `<option value="${room._id}">${room.name}${
                      room.floor ? ` (${room.floor})` : ""
                    }</option>`
                )
                .join("")}
            </select>
          </div>
        </div>
        <div class="popup-footer">
          <button class="btn btn-secondary popup-cancel">Cancel</button>
          <button class="btn btn-primary popup-assign">Assign Room</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Close modal handlers
    const closeModal = () => {
      document.body.removeChild(modal);
    };

    modal.querySelector(".popup-close").onclick = closeModal;
    modal.querySelector(".popup-cancel").onclick = closeModal;
    modal.onclick = (e) => {
      if (e.target === modal) closeModal();
    };

    // Assign room handler
    modal.querySelector(".popup-assign").onclick = () => {
      const roomId = modal.querySelector("#room-select").value;

      if (!roomId) {
        showPopup("Please select a waiting room", "warning");
        return;
      }

      closeModal();
      performRoomAssignment(selectedPatients, roomId, selectedCheckboxes);
    };
  } catch (error) {
    console.error("Error loading waiting rooms:", error);
    showPopup("Failed to load waiting rooms", "error");
  }
}

function performRoomAssignment(selectedPatients, roomId, selectedCheckboxes) {
  const token = localStorage.getItem("authToken");
  if (!token) {
    showPopup("Please log in to assign rooms", "error");
    return;
  }

  // Get queue IDs from the selected patients
  const queueIds = selectedPatients
    .map((p) => {
      const queueItem = allQueues.find((q) => q.queueNumber === p.ticket);
      return queueItem?.id || queueItem?._id;
    })
    .filter((id) => id);

  if (queueIds.length === 0) {
    showPopup("Could not find queue IDs for room assignment", "error");
    return;
  }

  fetch("https://qure-design.onrender.com/api/queues/assign-room", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      queueIds: queueIds,
      roomId: roomId,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        showPopup(
          `Assigned ${data.data.modifiedCount} patients to ${data.data.roomName}`,
          "success"
        );
        // Uncheck all selected checkboxes
        selectedCheckboxes.forEach((cb) => (cb.checked = false));
        // Hide profile since no patients are selected
        hideProfile();
        // Refresh the queue to show updated assignments
        loadMyHospitalQueues();
      } else {
        showPopup(`Error: ${data.message}`, "error");
      }
    })
    .catch((error) => {
      console.error("Room assignment error:", error);
      showPopup("Failed to assign room to patients", "error");
    });
}

function handleMarkNoShow() {
  const selectedCheckboxes = document.querySelectorAll(
    '.list-table tbody input[type="checkbox"]:checked'
  );
  if (selectedCheckboxes.length === 0) {
    showPopup("Please select patients to mark as no-show", "warning");
    return;
  }

  const selectedPatients = Array.from(selectedCheckboxes).map((cb) => {
    const row = cb.closest("tr");
    const name = row.querySelector(".name").innerText.trim();
    const ticket = row.querySelector("td:nth-child(3)").innerText;
    return { name, ticket };
  });

  showNoShowModal(selectedPatients, selectedCheckboxes);
}

function showNoShowModal(selectedPatients, selectedCheckboxes) {
  const modal = document.createElement("div");
  modal.className = "popup-modal";
  modal.innerHTML = `
    <div class="popup-content">
      <div class="popup-header">
        <h3>Mark as No-Show</h3>
        <button class="popup-close">&times;</button>
      </div>
      <div class="popup-body">
        <p>Mark <strong>${
          selectedPatients.length
        }</strong> patients as no-show?</p>
        <div class="patient-list">
          ${selectedPatients
            .map(
              (p) => `<div class="patient-item">• ${p.name} (${p.ticket})</div>`
            )
            .join("")}
        </div>
        <div class="warning-message">
          <i class="fa-solid fa-exclamation-triangle"></i>
          This action will notify patients and update their queue status.
        </div>
      </div>
      <div class="popup-footer">
        <button class="btn btn-secondary popup-cancel">Cancel</button>
        <button class="btn btn-danger popup-confirm">Mark as No-Show</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Close modal handlers
  const closeModal = () => {
    document.body.removeChild(modal);
  };

  modal.querySelector(".popup-close").onclick = closeModal;
  modal.querySelector(".popup-cancel").onclick = closeModal;
  modal.onclick = (e) => {
    if (e.target === modal) closeModal();
  };

  // Confirm handler
  modal.querySelector(".popup-confirm").onclick = () => {
    closeModal();
    performNoShow(selectedPatients, selectedCheckboxes);
  };
}

function performNoShow(selectedPatients, selectedCheckboxes) {
  const token = localStorage.getItem("authToken");
  if (!token) {
    showPopup("Please log in to mark patients as no-show", "error");
    return;
  }

  // Get queue IDs from the selected patients
  const queueIds = selectedPatients
    .map((p) => {
      const queueItem = allQueues.find((q) => q.queueNumber === p.ticket);
      return queueItem?.id || queueItem?._id;
    })
    .filter((id) => id);

  if (queueIds.length === 0) {
    showPopup("Could not find queue IDs for no-show marking", "error");
    return;
  }

  fetch("https://qure-design.onrender.com/api/queues/no-show", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      queueIds: queueIds,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        showPopup(
          `Marked ${data.data.noShowCount} patients as no-show`,
          "success"
        );
        // Uncheck all selected checkboxes
        selectedCheckboxes.forEach((cb) => (cb.checked = false));
        // Hide profile since no patients are selected
        hideProfile();
        // Refresh the queue to show updated status
        loadMyHospitalQueues();
      } else {
        showPopup(`Error: ${data.message}`, "error");
      }
    })
    .catch((error) => {
      console.error("Mark no-show error:", error);
      showPopup("Failed to mark patients as no-show", "error");
    });
}

// Custom popup system
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

// Add CSS styles for popups
const style = document.createElement("style");
style.textContent = `
  /* Popup Modal Styles */
  .popup-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.3s ease;
  }
  
  .popup-content {
    background: white;
    border-radius: 12px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    animation: slideIn 0.3s ease;
  }
  
  .popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .popup-header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
  }
  
  .popup-close {
    background: none;
    border: none;
    font-size: 24px;
    color: #6b7280;
    cursor: pointer;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    transition: all 0.2s ease;
  }
  
  .popup-close:hover {
    background: #f3f4f6;
    color: #374151;
  }
  
  .popup-body {
    padding: 24px;
  }
  
  .popup-body p {
    margin: 0 0 16px 0;
    color: #374151;
    line-height: 1.5;
  }
  
  .patient-list {
    background: #f9fafb;
    border-radius: 8px;
    padding: 12px;
    margin: 16px 0;
    max-height: 120px;
    overflow-y: auto;
  }
  
  .patient-item {
    padding: 4px 0;
    color: #4b5563;
    font-size: 14px;
  }
  
  .form-group {
    margin: 16px 0;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 6px;
    font-weight: 500;
    color: #374151;
  }
  
  .form-control {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
    transition: border-color 0.2s ease;
    box-sizing: border-box;
  }
  
  .form-control:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .popup-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 20px 24px;
    border-top: 1px solid #e5e7eb;
  }
  
  .btn {
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    min-width: 100px;
  }
  
  .btn-secondary {
    background: #f3f4f6;
    color: #374151;
  }
  
  .btn-secondary:hover {
    background: #e5e7eb;
  }
  
  .btn-primary {
    background: #3b82f6;
    color: white;
  }
  
  .btn-primary:hover {
    background: #2563eb;
  }
  
  .btn-danger {
    background: #ef4444;
    color: white;
  }
  
  .btn-danger:hover {
    background: #dc2626;
  }
  
  .warning-message {
    background: #fef3c7;
    border: 1px solid #f59e0b;
    border-radius: 6px;
    padding: 12px;
    margin: 16px 0;
    display: flex;
    align-items: center;
    gap: 8px;
    color: #92400e;
    font-size: 14px;
  }
  
  .warning-message i {
    color: #f59e0b;
  }
  
  /* Toast Popup Styles */
  .popup-toast {
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    padding: 16px 20px;
    z-index: 1050;
    transform: translateX(400px);
    transition: transform 0.3s ease;
    border-left: 4px solid #3b82f6;
    min-width: 300px;
    max-width: 400px;
  }
  
  .popup-toast.show {
    transform: translateX(0);
  }
  
  .popup-toast-success {
    border-left-color: #10b981;
  }
  
  .popup-toast-error {
    border-left-color: #ef4444;
  }
  
  .popup-toast-warning {
    border-left-color: #f59e0b;
  }
  
  .popup-toast-content {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .popup-toast-content i {
    font-size: 20px;
    flex-shrink: 0;
  }
  
  .popup-toast-success i {
    color: #10b981;
  }
  
  .popup-toast-error i {
    color: #ef4444;
  }
  
  .popup-toast-warning i {
    color: #f59e0b;
  }
  
  .popup-toast-content span {
    color: #374151;
    font-size: 14px;
    line-height: 1.4;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideIn {
    from { 
      opacity: 0;
      transform: translateY(-20px) scale(0.95);
    }
    to { 
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
`;
document.head.appendChild(style);

document.addEventListener("DOMContentLoaded", () => {
  loadMyHospitalQueues();

  // Add event listeners for action buttons
  const callNextBtn = document.querySelector(".button-choose .btn.all");
  const notifyBtn = document.querySelector(".button-choose .btn.waiting");
  const reassignBtn = document.querySelector(".button-choose .btn.in-progress");
  const noShowBtn = document.querySelector(".button-choose .btn.completed");

  callNextBtn?.addEventListener("click", handleCallNext);
  notifyBtn?.addEventListener("click", handleNotifySelected);
  reassignBtn?.addEventListener("click", handleAssignRoom);
  noShowBtn?.addEventListener("click", handleMarkNoShow);
});
