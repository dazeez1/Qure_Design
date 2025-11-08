"use strict";

// API Configuration
const API_BASE_URL = "https://qure-design.onrender.com/api";

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

// Utility Functions
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function setLoadingState(button, isLoading) {
  if (isLoading) {
    button.disabled = true;
    button.textContent = "Sending...";
    button.style.opacity = "0.7";
  } else {
    button.disabled = false;
    button.textContent = "Send Reset Link";
    button.style.opacity = "1";
  }
}

// API Function
async function sendForgotPasswordRequest(email) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to send reset link");
    }

    return data;
  } catch (error) {
    throw error;
  }
}

// Form Handler
document
  .getElementById("forget-password-form")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const emailError = document.getElementById("email-error");
    const submitButton = document.getElementById("reset-btn");

    // Clear previous errors
    emailError.textContent = "";

    // Validation
    if (email === "") {
      emailError.textContent = "Please enter an email address.";
      emailError.style.color = "red";
      return;
    }

    if (!isValidEmail(email)) {
      emailError.textContent = "Please enter a valid email address.";
      emailError.style.color = "red";
      return;
    }

    // Set loading state
    setLoadingState(submitButton, true);

    try {
      const data = await sendForgotPasswordRequest(email);

      // Show success popup
      showCustomPopup(
        "Reset Link Sent",
        data.message + " Please check your email inbox and spam folder.",
        "success"
      );

      // Clear form
      document.getElementById("email").value = "";
    } catch (error) {
      console.error("Forgot password error:", error);
      showCustomPopup("Error", error.message, "error");
    } finally {
      setLoadingState(submitButton, false);
    }
  });

// Add CSS animations
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
