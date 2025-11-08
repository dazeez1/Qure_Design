"use strict";

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
const inputArea = document.querySelector("#code-area");
const errorMsg = document.querySelector(".error-msg");
const continueBtn = document.querySelector(".continue-btn");
const backBtn = document.querySelector(".back-btn");

// Sidebar functionality
let sideBarOpen = false;
const sidebar = document.getElementById("sidebar");

function openSideBar() {
  if (!sideBarOpen) {
    sidebar.classList.add("sidebar-responsive");
    sideBarOpen = true;
  }
}

function closeSideBar() {
  if (sideBarOpen) {
    sidebar.classList.remove("sidebar-responsive");
    sideBarOpen = false;
  }
}

// Access Code Validation
async function validateAccessCode(code) {
  try {
    const response = await fetch(
      "https://qure-design.onrender.com/api/auth/validate-access-code",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accessCode: code }),
      }
    );

    const data = await response.json();

    if (response.ok) {
      return { success: true, data: data };
    } else {
      return { success: false, message: data.message || "Invalid access code" };
    }
  } catch (error) {
    console.error("Access code validation error:", error);
    return { success: false, message: "Network error. Please try again." };
  }
}

// Check Access Code
async function checkCode() {
  const code = inputArea.value.trim();

  // Clear previous errors
  errorMsg.textContent = "";
  inputArea.style.borderColor = "";

  // Validate input
  if (!code) {
    errorMsg.textContent = "Please enter an access code";
    inputArea.style.borderColor = "#ef4444";
    inputArea.focus();
    return;
  }

  if (code.length < 4) {
    errorMsg.textContent = "Access code must be at least 4 characters";
    inputArea.style.borderColor = "#ef4444";
    inputArea.focus();
    return;
  }

  // Show loading state
  continueBtn.disabled = true;
  continueBtn.textContent = "Validating...";
  continueBtn.style.opacity = "0.7";

  try {
    const result = await validateAccessCode(code);

    if (result.success) {
      // Store access code validation result
      localStorage.setItem("staffAccessValidated", "true");
      localStorage.setItem("staffAccessCode", code);

      showCustomPopup(
        "Access Granted",
        "Welcome to the staff dashboard!",
        "success"
      );

      // Redirect after a short delay
      setTimeout(() => {
        window.location.href = "hospital-dashboard.html";
      }, 1500);
    } else {
      errorMsg.textContent = result.message;
      inputArea.style.borderColor = "#ef4444";
      inputArea.focus();
    }
  } catch (error) {
    console.error("Error validating access code:", error);
    showCustomPopup(
      "Error",
      "Failed to validate access code. Please try again.",
      "error"
    );
  } finally {
    // Reset button state
    continueBtn.disabled = false;
    continueBtn.textContent = "Continue";
    continueBtn.style.opacity = "1";
  }
}

// Event Listeners
continueBtn.addEventListener("click", (e) => {
  e.preventDefault();
  checkCode();
});

inputArea.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    e.preventDefault();
    checkCode();
  }
});

backBtn.addEventListener("click", (e) => {
  e.preventDefault();
  window.location.href = "index.html";
});

// Input validation on change
inputArea.addEventListener("input", function () {
  if (errorMsg.textContent) {
    errorMsg.textContent = "";
    inputArea.style.borderColor = "";
  }
});

// Add CSS animations
const style = document.createElement("style");
style.textContent = `
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
