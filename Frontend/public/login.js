"use strict";

// API Configuration - Production v3 - Cache Buster: 2025-09-13-01-10
const API_BASE_URL = "https://qure-design.onrender.com/api";

// DOM Elements
const loginForm = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const toggleIcon = document.querySelector(".toggle-password");
const patientBtn = document.getElementById("login-patient-btn");
const staffBtn = document.getElementById("login-staff-btn");
const rememberCheckbox = document.getElementById("remember-me");

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
  const group = input.closest(".input-group, .lgn");
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

function showErrorMessage(message) {
  const errorDiv = document.createElement("div");
  errorDiv.className = "error-message";
  errorDiv.textContent = message;
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
}

function setLoadingState(button, isLoading, originalText) {
  if (isLoading) {
    button.disabled = true;
    button.textContent = "Signing in...";
    button.style.opacity = "0.7";
  } else {
    button.disabled = false;
    button.textContent = originalText;
    button.style.opacity = "1";
  }
}

function isValidEmail(email) {
  email = email.trim();
  const atIndex = email.indexOf("@");
  const dotIndex = email.lastIndexOf(".");
  if (atIndex < 1) return false;
  if (dotIndex <= atIndex + 1) return false;
  if (dotIndex === email.length - 1) return false;
  return true;
}

function isValidPhone(phone) {
  phone = phone.trim();
  if (phone.length < 10 || phone.length > 15) return false;
  for (let i = 0; i < phone.length; i++) {
    const char = phone[i];
    if (!(char >= "0" && char <= "9")) return false;
  }
  return true;
}

function isValidEmailOrPhone(value) {
  return isValidEmail(value) || isValidPhone(value);
}

// API Functions
async function loginUser(emailOrPhone, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        emailOrPhone: emailOrPhone,
        password: password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Login failed");
    }

    // Store token and user data
    localStorage.setItem("authToken", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    return data;
  } catch (error) {
    throw error;
  }
}

function validateLoginForm() {
  clearErrors(loginForm);
  let valid = true;

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email) {
    showError(emailInput, "Email or phone is required");
    valid = false;
  } else if (!isValidEmailOrPhone(email)) {
    showError(emailInput, "Enter a valid email or phone");
    valid = false;
  }

  if (!password) {
    showError(passwordInput, "Password is required");
    valid = false;
  }

  return valid;
}

// Login Handlers
async function handleLogin(expectedRole) {
  if (!validateLoginForm()) {
    return;
  }

  const emailOrPhone = emailInput.value.trim();
  const password = passwordInput.value.trim();

  const button = expectedRole === "patient" ? patientBtn : staffBtn;
  const originalText = button.textContent;

  setLoadingState(button, true, originalText);

  try {
    const data = await loginUser(emailOrPhone, password);

    // Check if user role matches expected role
    if (data.user.role !== expectedRole) {
      throw new Error(
        `Please login as ${expectedRole === "patient" ? "Patient" : "Staff"}`
      );
    }

    showSuccessMessage("Login successful! Redirecting...");

    setTimeout(() => {
      if (data.user.role === "patient") {
        window.location.href = "patient-dashboard.html";
      } else {
        window.location.href = "hospital-dashboard.html";
      }
    }, 1500);
  } catch (error) {
    console.error("Login error:", error);
    showErrorMessage(error.message);
  } finally {
    setLoadingState(button, false, originalText);
  }
}

// Event Listeners
toggleIcon.addEventListener("click", () => {
  togglePassword(passwordInput, toggleIcon);
});

patientBtn.addEventListener("click", (e) => {
  e.preventDefault();
  handleLogin("patient");
});

staffBtn.addEventListener("click", (e) => {
  e.preventDefault();
  handleLogin("staff");
});

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
