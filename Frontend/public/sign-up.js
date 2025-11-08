"use strict";

// API Configuration
const API_BASE_URL = "https://qure-design.onrender.com/api";

// Utility Functions
function togglePassword(input, icon) {
  if (input.type === "password") {
    input.type = "text";
    icon.src =
      "asset/image/visibility_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg";
    icon.alt = "visible";
  } else {
    input.type = "password";
    icon.src =
      "asset/image/visibility_off_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg";
    icon.alt = "invisible";
  }
}

function showError(input, message) {
  const group = input.closest(".input-group");
  let span = group.querySelector(".status");
  if (!span) {
    span = document.createElement("span");
    span.className = "status";
    group.appendChild(span);
  }
  span.textContent = message;
  span.style.color = "red";
}

function clearErrors(form) {
  const spans = form.querySelectorAll(".status");
  spans.forEach((s) => {
    s.textContent = "";
    s.removeAttribute("style");
  });
}

function showSuccessMessage(message) {
  const successDiv = document.createElement("div");
  successDiv.className = "success-message";
  successDiv.textContent = message;
  successDiv.style.cssText = `
    position: fixed;
    top: 2rem;
    right: 2rem;
    background-color: #10b981;
    color: white;
    padding: 1rem 2rem;
    border-radius: 0.5rem;
    font-size: 1.4rem;
    z-index: 1001;
    animation: slideIn 0.3s ease;
  `;
  document.body.appendChild(successDiv);
  setTimeout(() => successDiv.remove(), 3000);
}

function setLoadingState(button, isLoading) {
  if (isLoading) {
    button.disabled = true;
    button.textContent = "Creating Account...";
    button.style.opacity = "0.7";
  } else {
    button.disabled = false;
    button.textContent = button.dataset.originalText;
    button.style.opacity = "1";
  }
}

// DOM Elements
const patientForm = document.getElementById("form-patient");
const staffForm = document.querySelector("#form-staff");
const toggleIcons = document.querySelectorAll(".toggle-password");
const roleRadios = document.querySelectorAll('input[name="role"]');

// Store original button text
document.getElementById("patient-submit").dataset.originalText =
  "Sign up as patient";
document.getElementById("staff-submt").dataset.originalText =
  "Sign up as staff";

// Form Visibility Toggle
patientForm.classList.remove("hidden");
staffForm.classList.add("hidden");

roleRadios.forEach((radio) => {
  radio.addEventListener("change", (e) => {
    if (e.target.value === "patient") {
      patientForm.classList.remove("hidden");
      staffForm.classList.add("hidden");
    } else {
      patientForm.classList.add("hidden");
      staffForm.classList.remove("hidden");
    }
  });
});

// Password Toggle
toggleIcons.forEach((icon) => {
  icon.addEventListener("click", () => {
    const input = icon.previousElementSibling;
    togglePassword(input, icon);
  });
});

// API Functions
async function registerUser(formData, role) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: role,
        hospitalName: role === "staff" ? formData.hospitalName : undefined,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Registration failed");
    }

    // Store token and user data
    localStorage.setItem("authToken", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    return data;
  } catch (error) {
    throw error;
  }
}

function validateFormData(form, role) {
  const formData = new FormData(form);
  const data = {};

  for (let [key, value] of formData.entries()) {
    data[key] = value.trim();
  }

  // Map frontend field names to backend expected names
  const mappedData = {
    firstName:
      role === "patient" ? data["patient-firstname"] : data["staff-firstname"],
    lastName:
      role === "patient" ? data["patient-lastname"] : data["staff-lastname"],
    email: role === "patient" ? data["patient-email"] : data["staff-email"],
    phone: role === "patient" ? data["patient-number"] : data["staff-number"],
    password:
      role === "patient" ? data["patient-password"] : data["staff-password"],
    confirm_password:
      role === "patient"
        ? data["patient-confirm_password"]
        : data["staff-confirm_password"],
    hospitalName: role === "staff" ? data["hospital"] : undefined,
  };

  // Basic validation
  if (!mappedData.firstName) throw new Error("First name is required");
  if (!mappedData.lastName) throw new Error("Last name is required");
  if (!mappedData.email) throw new Error("Email is required");
  if (!mappedData.phone) throw new Error("Phone number is required");
  if (!mappedData.password) throw new Error("Password is required");
  if (mappedData.password !== mappedData.confirm_password)
    throw new Error("Passwords do not match");
  if (role === "staff" && !mappedData.hospitalName)
    throw new Error("Hospital name is required");

  return mappedData;
}

// Form Handlers
async function handlePatientSignup(e) {
  e.preventDefault();
  clearErrors(patientForm);

  const submitButton = document.getElementById("patient-submit");
  setLoadingState(submitButton, true);

  try {
    const formData = validateFormData(patientForm, "patient");
    await registerUser(formData, "patient");

    showSuccessMessage("Account created successfully! Redirecting...");
    setTimeout(() => {
      window.location.href = "patient-dashboard.html";
    }, 1500);
  } catch (error) {
    console.error("Registration error:", error);

    // Show error message
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-message";
    errorDiv.textContent = error.message;
    errorDiv.style.cssText = `
      position: fixed;
      top: 2rem;
      right: 2rem;
      background-color: #ef4444;
      color: white;
      padding: 1rem 2rem;
      border-radius: 0.5rem;
      font-size: 1.4rem;
      z-index: 1001;
      animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
  } finally {
    setLoadingState(submitButton, false);
  }
}

async function handleStaffSignup(e) {
  e.preventDefault();
  clearErrors(staffForm);

  const submitButton = document.getElementById("staff-submt");
  setLoadingState(submitButton, true);

  try {
    const formData = validateFormData(staffForm, "staff");
    await registerUser(formData, "staff");

    showSuccessMessage(
      "Account created successfully! Check your email for the access code. Redirecting to access page..."
    );
    setTimeout(() => {
      window.location.href = "access.html";
    }, 2000);
  } catch (error) {
    console.error("Registration error:", error);

    // Show error message
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-message";
    errorDiv.textContent = error.message;
    errorDiv.style.cssText = `
      position: fixed;
      top: 2rem;
      right: 2rem;
      background-color: #ef4444;
      color: white;
      padding: 1rem 2rem;
      border-radius: 0.5rem;
      font-size: 1.4rem;
      z-index: 1001;
      animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
  } finally {
    setLoadingState(submitButton, false);
  }
}

// Event Listeners
patientForm.addEventListener("submit", handlePatientSignup);
staffForm.addEventListener("submit", handleStaffSignup);

// Add CSS animation
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
`;
document.head.appendChild(style);
