"use strict";

// DOM Elements
const queueTrackingForm = document.getElementById("queue-tracking-form");
const ticketNumberInput = document.getElementById("ticket-number");
const ticketErrorElement = document.getElementById("ticket-error");
const checkStatusButton = document.getElementById("check-status-btn");
const mobileMenuToggle = document.getElementById("mobile-menu-toggle");
const mobileNavigation = document.getElementById("mobile-navigation");
const mobileCloseButton = document.getElementById("mobile-close-button");

// Form validation and submission
const validateTicketNumber = (ticketNumber) => {
  const trimmedTicket = ticketNumber.trim();

  if (!trimmedTicket) {
    return "Please enter a ticket or appointment number";
  }

  if (trimmedTicket.length < 3) {
    return "Ticket number must be at least 3 characters long";
  }

  if (trimmedTicket.length > 20) {
    return "Ticket number must be less than 20 characters";
  }

  // Allow alphanumeric characters, hyphens, and underscores
  const ticketPattern = /^[A-Za-z0-9-_]+$/;
  if (!ticketPattern.test(trimmedTicket)) {
    return "Ticket number can only contain letters, numbers, hyphens, and underscores";
  }

  return null; // No error
};

const showInputError = (message) => {
  ticketErrorElement.textContent = message;
  ticketErrorElement.style.display = "block";
  ticketNumberInput.style.borderColor = "#ef4444";
};

const clearInputError = () => {
  ticketErrorElement.textContent = "";
  ticketErrorElement.style.display = "none";
  ticketNumberInput.style.borderColor = "#e5e5e5";
};

const setLoadingState = (isLoading) => {
  if (isLoading) {
    checkStatusButton.disabled = true;
    checkStatusButton.textContent = "Checking...";
    queueTrackingForm.classList.add("loading");
  } else {
    checkStatusButton.disabled = false;
    checkStatusButton.textContent = "Check Status";
    queueTrackingForm.classList.remove("loading");
  }
};

// Backend integration placeholder for queue status
const checkQueueStatus = async (ticketNumber) => {
  // Replace with: await api.queue.getStatus(ticketNumber)
  throw new Error(
    "Queue status service not connected. Backend integration pending."
  );
};

const displayQueueStatus = (statusData) => {
  // TODO: Render a proper modal or redirect when backend is connected
  console.log("Queue status:", statusData);
};

const handleFormSubmission = async (event) => {
  event.preventDefault();
  // Relaxed: navigate to real-time tracking for now
  window.location.href = "real-time-queue-tracking.html";
};

// Mobile menu functionality
const toggleMobileMenu = () => {
  const isMenuOpen = mobileNavigation.classList.contains("active");

  if (isMenuOpen) {
    mobileNavigation.classList.remove("active");
    document.body.style.overflow = "auto";
  } else {
    mobileNavigation.classList.add("active");
    document.body.style.overflow = "hidden";
  }
};

const closeMobileMenu = () => {
  mobileNavigation.classList.remove("active");
  document.body.style.overflow = "auto";
};

// Input field real-time validation
const handleInputChange = () => {
  const ticketNumber = ticketNumberInput.value;

  if (ticketNumber) {
    const validationError = validateTicketNumber(ticketNumber);
    if (validationError) {
      showInputError(validationError);
    } else {
      clearInputError();
    }
  } else {
    clearInputError();
  }
};

// Keyboard shortcuts
const handleKeyboardShortcuts = (event) => {
  // Ctrl/Cmd + Enter to submit form
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    event.preventDefault();
    queueTrackingForm.dispatchEvent(new Event("submit"));
  }

  // Escape to close mobile menu
  if (event.key === "Escape") {
    closeMobileMenu();
  }
};

// Auto-focus ticket input on page load
const initializePage = () => {
  ticketNumberInput.focus();

  // Clear any existing data
  ticketNumberInput.value = "";
  clearInputError();

  // Add smooth scrolling for better UX
  document.documentElement.style.scrollBehavior = "smooth";
};

// Event Listeners
queueTrackingForm.addEventListener("submit", handleFormSubmission);
// Relaxed: disable live validation during navigation-only mode
mobileMenuToggle.addEventListener("click", toggleMobileMenu);
mobileCloseButton.addEventListener("click", closeMobileMenu);

// Close mobile menu when clicking outside
document.addEventListener("click", (event) => {
  if (
    mobileNavigation.classList.contains("active") &&
    !mobileNavigation.contains(event.target) &&
    !mobileMenuToggle.contains(event.target)
  ) {
    closeMobileMenu();
  }
});

// Keyboard event listeners
document.addEventListener("keydown", handleKeyboardShortcuts);

// Initialize page when DOM is loaded
document.addEventListener("DOMContentLoaded", initializePage);

// Handle page visibility changes
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    // Page became visible again, refresh focus
    ticketNumberInput.focus();
  }
});

// Export functions for testing (if needed)
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    validateTicketNumber,
    checkQueueStatus,
    showInputError,
    clearInputError,
  };
}
