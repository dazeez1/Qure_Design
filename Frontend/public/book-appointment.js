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

// Custom Popup Function
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

// DOM Elements
const mobileMenuToggle = document.getElementById("mobile-menu-toggle");
const mobileNavigation = document.getElementById("mobile-navigation");
const mobileCloseButton = document.getElementById("mobile-close-button");
const bookingForm = document.getElementById("booking-form");
const successModal = document.getElementById("success-modal");
const modalClose = document.getElementById("modal-close");
const goToDashboardBtn = document.getElementById("go-to-dashboard");

// Form Elements
const serviceDepartmentSelect = document.getElementById("service-department");
const hospitalSelect = document.getElementById("hospital-name");
const appointmentDateInput = document.getElementById("appointment-date");
const appointmentTimeInput = document.getElementById("appointment-time");
const phoneNumberInput = document.getElementById("phone-number");
const reasonVisitSelect = document.getElementById("reason-visit");
const otherSpecifyTextarea = document.getElementById("other-specify");
const reviewSmsToggle = document.getElementById("review-sms");
const patientGenderSelect = document.getElementById("patient-gender");
const patientDobInput = document.getElementById("patient-dob");

// Display Elements
const displayDate = document.getElementById("display-date");
const displayTime = document.getElementById("display-time");
const smsNotification = document.getElementById("sms-notification");

// Modal Elements
const modalDate = document.getElementById("modal-date");
const modalTime = document.getElementById("modal-time");
const modalDepartment = document.getElementById("modal-department");

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

// Set minimum date to today
const today = new Date().toISOString().split("T")[0];
appointmentDateInput.setAttribute("min", today);

// Set default time to current time + 1 hour
const now = new Date();
now.setHours(now.getHours() + 1);
const defaultTime = now.toTimeString().slice(0, 5);
appointmentTimeInput.value = defaultTime;

// Real-time form updates
const updateAppointmentDetails = () => {
  const selectedDate = appointmentDateInput.value;
  const selectedTime = appointmentTimeInput.value;
  const selectedDepartment = serviceDepartmentSelect.value;

  if (selectedDate) {
    const dateObj = new Date(selectedDate);
    const formattedDate = dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    displayDate.textContent = formattedDate;
    modalDate.textContent = formattedDate;
  }

  if (selectedTime) {
    const timeObj = new Date(`2000-01-01T${selectedTime}`);
    const formattedTime = timeObj.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    displayTime.textContent = formattedTime;
    modalTime.textContent = formattedTime;
  }

  if (selectedDepartment) {
    const departmentText =
      serviceDepartmentSelect.options[serviceDepartmentSelect.selectedIndex]
        .text;
    modalDepartment.textContent = departmentText;

    // Update SMS notification
    if (selectedDate && selectedTime) {
      const timeObj = new Date(`2000-01-01T${selectedTime}`);
      const formattedTime = timeObj.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      smsNotification.textContent = `Your appointment is confirmed at ${formattedTime} on ${displayDate.textContent}`;
    }
  }
};

// Event listeners for real-time updates
appointmentDateInput.addEventListener("change", updateAppointmentDetails);
appointmentTimeInput.addEventListener("change", updateAppointmentDetails);
serviceDepartmentSelect.addEventListener("change", updateAppointmentDetails);

// Form validation
const validateForm = () => {
  let isValid = true;
  const errors = [];

  // Clear previous error states
  clearFormErrors();

  // Validate Service/Department
  if (!serviceDepartmentSelect.value) {
    showFieldError(serviceDepartmentSelect, "Please select a department");
    isValid = false;
    errors.push("Department selection required");
  }

  // Validate Hospital
  if (!hospitalSelect.value) {
    showFieldError(hospitalSelect, "Please select a hospital");
    isValid = false;
    errors.push("Hospital selection required");
  }

  // Validate Date
  if (!appointmentDateInput.value) {
    showFieldError(appointmentDateInput, "Please select a date");
    isValid = false;
    errors.push("Date selection required");
  } else {
    const selectedDate = new Date(appointmentDateInput.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      showFieldError(appointmentDateInput, "Date cannot be in the past");
      isValid = false;
      errors.push("Invalid date");
    }
  }

  // Validate Time
  if (!appointmentTimeInput.value) {
    showFieldError(appointmentTimeInput, "Please select a time");
    isValid = false;
    errors.push("Time selection required");
  }

  // Validate Phone Number
  if (!phoneNumberInput.value.trim()) {
    showFieldError(phoneNumberInput, "Phone number is required");
    isValid = false;
    errors.push("Phone number required");
  } else if (!isValidPhoneNumber(phoneNumberInput.value.trim())) {
    showFieldError(phoneNumberInput, "Please enter a valid phone number");
    isValid = false;
    errors.push("Invalid phone number");
  }

  // Validate Reason for Visit
  if (!reasonVisitSelect.value) {
    showFieldError(reasonVisitSelect, "Please select a reason for visit");
    isValid = false;
    errors.push("Reason for visit required");
  }

  // Validate Other Specify if "Other" is selected
  if (
    reasonVisitSelect.value === "other" &&
    !otherSpecifyTextarea.value.trim()
  ) {
    showFieldError(otherSpecifyTextarea, "Please specify the reason for visit");
    isValid = false;
    errors.push("Other reason specification required");
  }

  // Validate Gender
  if (!patientGenderSelect.value) {
    showFieldError(patientGenderSelect, "Please select your gender");
    isValid = false;
    errors.push("Gender selection required");
  }

  // Validate Date of Birth
  if (!patientDobInput.value) {
    showFieldError(patientDobInput, "Please enter your date of birth");
    isValid = false;
    errors.push("Date of birth required");
  } else {
    const dob = new Date(patientDobInput.value);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();

    if (dob > today) {
      showFieldError(patientDobInput, "Date of birth cannot be in the future");
      isValid = false;
      errors.push("Invalid date of birth");
    } else if (age > 120) {
      showFieldError(patientDobInput, "Please enter a valid date of birth");
      isValid = false;
      errors.push("Invalid date of birth");
    }
  }

  return { isValid, errors };
};

// Phone number validation
const isValidPhoneNumber = (phone) => {
  // Basic phone validation - allows various formats
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ""));
};

// Show field error
const showFieldError = (field, message) => {
  field.style.borderColor = "#dc2626";

  // Create or update error message
  let errorElement = field.parentElement.querySelector(".field-error");
  if (!errorElement) {
    errorElement = document.createElement("span");
    errorElement.className = "field-error";
    errorElement.style.cssText = `
      color: #dc2626;
      font-size: 1.2rem;
      margin-top: 0.4rem;
      display: block;
    `;
    field.parentElement.appendChild(errorElement);
  }
  errorElement.textContent = message;
};

// Clear form errors
const clearFormErrors = () => {
  document.querySelectorAll(".field-error").forEach((error) => error.remove());
  document
    .querySelectorAll(".form-input, .form-select, .form-textarea")
    .forEach((field) => {
      field.style.borderColor = "#d1d5db";
    });
};

// Handle form submission
const handleFormSubmit = async (e) => {
  e.preventDefault();

  const validation = validateForm();

  if (!validation.isValid) {
    console.log("Form validation failed:", validation.errors);
    return;
  }

  // Show loading state
  const submitBtn = document.getElementById("book-appointment-btn");
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = "Booking...";

  try {
    // Get user data for full name
    const userData = localStorage.getItem("user");
    const user = userData ? JSON.parse(userData) : null;
    const fullName = user
      ? `${user.firstName} ${user.lastName}`
      : "Unknown Patient";

    // Prepare appointment data
    const appointmentData = {
      doctor:
        "Dr. " +
        serviceDepartmentSelect.options[serviceDepartmentSelect.selectedIndex]
          .text,
      specialty:
        serviceDepartmentSelect.options[serviceDepartmentSelect.selectedIndex]
          .text,
      appointmentDate: appointmentDateInput.value,
      appointmentTime: appointmentTimeInput.value,
      notes:
        reasonVisitSelect.value === "other"
          ? otherSpecifyTextarea.value.trim()
          : reasonVisitSelect.options[reasonVisitSelect.selectedIndex].text,
      hospitalName: hospitalSelect.options[hospitalSelect.selectedIndex].text,
      patientInfo: {
        fullName: fullName,
        phoneNumber: phoneNumberInput.value,
        gender: patientGenderSelect.value,
        dateOfBirth: patientDobInput.value,
      },
    };

    // Make API call to create appointment
    const response = await makeApiCall("/appointments", {
      method: "POST",
      body: JSON.stringify(appointmentData),
    });

    // Reset button
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;

    // Show success modal
    showSuccessModal();
  } catch (error) {
    // Reset button
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;

    // Show error popup
    showCustomPopup(
      "Booking Failed",
      handleApiError(error, "Failed to book appointment. Please try again."),
      "error"
    );
  }
};

// Show success modal
const showSuccessModal = () => {
  successModal.classList.add("active");
  document.body.style.overflow = "hidden";
};

// Hide success modal
const hideSuccessModal = () => {
  successModal.classList.remove("active");
  document.body.style.overflow = "auto";
};

// Modal event listeners
modalClose.addEventListener("click", hideSuccessModal);
goToDashboardBtn.addEventListener("click", () => {
  hideSuccessModal();
  // Redirect back to Patient Dashboard
  window.location.href = "patient-dashboard.html";
});

// Close modal when clicking outside
successModal.addEventListener("click", (e) => {
  if (e.target === successModal) {
    hideSuccessModal();
  }
});

// Handle reason for visit change
const handleReasonChange = () => {
  const selectedReason = reasonVisitSelect.value;
  const otherSpecifyGroup = otherSpecifyTextarea.parentElement;

  if (selectedReason === "other") {
    otherSpecifyTextarea.required = true;
    otherSpecifyTextarea.style.display = "block";
  } else {
    otherSpecifyTextarea.required = false;
    otherSpecifyTextarea.style.display = "none";
    otherSpecifyTextarea.value = "";
  }
};

// Event listeners
bookingForm.addEventListener("submit", handleFormSubmit);
reasonVisitSelect.addEventListener("change", handleReasonChange);

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  console.log("Book Appointment page loaded successfully");

  // Check if user is logged in
  const userData = localStorage.getItem("user");
  const authToken = localStorage.getItem("authToken");

  if (!userData || !authToken) {
    // Redirect to login if not authenticated
    window.location.href = "login.html";
    return;
  }

  // Parse user data and update patient details
  try {
    const user = JSON.parse(userData);
    if (user.role !== "patient") {
      // Redirect if not a patient
      window.location.href = "login.html";
      return;
    }

    // Update patient details with real user data
    updatePatientDetails(user);
  } catch (error) {
    console.error("Error parsing user data:", error);
    window.location.href = "login.html";
    return;
  }

  // Set initial values
  updateAppointmentDetails();

  // Load hospitals list
  loadHospitals();

  // Set default time to current time + 1 hour
  const now = new Date();
  now.setHours(now.getHours() + 1);
  const defaultTime = now.toTimeString().slice(0, 5);
  appointmentTimeInput.value = defaultTime;

  // Update display immediately
  updateAppointmentDetails();
});

async function loadHospitals() {
  try {
    const res = await fetch(`${API_BASE_URL}/hospitals`);
    const data = await res.json();
    if (data.success && Array.isArray(data.data)) {
      data.data.forEach((h) => {
        const opt = document.createElement("option");
        opt.value = h.code;
        opt.textContent = h.name;
        hospitalSelect.appendChild(opt);
      });
    }
  } catch (e) {
    console.error("Failed to load hospitals", e);
  }
}

// Update patient details with real user data
const updatePatientDetails = (user) => {
  // Update patient name
  const nameInput = document.querySelector(
    ".patient-info .form-input[readonly]"
  );
  if (nameInput && user.firstName && user.lastName) {
    nameInput.value = `${user.firstName.toUpperCase()} ${user.lastName.toUpperCase()}`;
  }

  // Update phone number in the form
  if (phoneNumberInput && user.phone) {
    phoneNumberInput.value = user.phone;
  }

  // Update gender if available
  if (patientGenderSelect && user.gender) {
    patientGenderSelect.value = user.gender;
  }

  // Update date of birth if available
  if (patientDobInput && user.dateOfBirth) {
    const dob = new Date(user.dateOfBirth);
    patientDobInput.value = dob.toISOString().split("T")[0];
  }
};

// Handle window resize for responsive behavior
window.addEventListener("resize", () => {
  if (window.innerWidth > 768) {
    closeMobileMenu();
  }
});

// Enhanced form interactions
const enhanceFormInteractions = () => {
  // Add focus effects
  document
    .querySelectorAll(".form-input, .form-select, .form-textarea")
    .forEach((field) => {
      field.addEventListener("focus", () => {
        field.parentElement.style.transform = "translateY(-2px)";
        field.parentElement.style.transition = "transform 0.3s ease";
      });

      field.addEventListener("blur", () => {
        field.parentElement.style.transform = "translateY(0)";
      });
    });

  // Add character counter for textarea
  otherSpecifyTextarea.addEventListener("input", () => {
    const maxLength = 500;
    const currentLength = otherSpecifyTextarea.value.length;

    let counter =
      otherSpecifyTextarea.parentElement.querySelector(".char-counter");
    if (!counter) {
      counter = document.createElement("span");
      counter.className = "char-counter";
      counter.style.cssText = `
        font-size: 1.2rem;
        color: #64748b;
        text-align: right;
        margin-top: 0.4rem;
      `;
      otherSpecifyTextarea.parentElement.appendChild(counter);
    }

    counter.textContent = `${currentLength}/${maxLength}`;

    if (currentLength > maxLength * 0.9) {
      counter.style.color = "#dc2626";
    } else {
      counter.style.color = "#64748b";
    }
  });
};

// Initialize enhanced interactions
document.addEventListener("DOMContentLoaded", enhanceFormInteractions);

// Add smooth scrolling for better UX
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  });
});

// Add CSS animations for popup
const style = document.createElement("style");
style.textContent = `
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  @keyframes slideIn {
    from {
      transform: translateY(-20px) scale(0.95);
      opacity: 0;
    }
    to {
      transform: translateY(0) scale(1);
      opacity: 1;
    }
  }
  
  .custom-popup {
    animation: slideIn 0.3s ease !important;
  }
`;
document.head.appendChild(style);

// Removed localStorage autosave/restore. Backend should provide draft persistence if needed.
