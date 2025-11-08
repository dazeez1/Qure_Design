"use strict";

// DOM Elements
const profileForm = document.getElementById("profile-form");
const profilePictureInput = document.getElementById("profile-picture-input");
const profilePicturePlaceholder = document.getElementById("profile-picture");
const profilePictureImage = document.getElementById("profile-picture-image");
const uploadButton = document.getElementById("upload-button");
const saveChangesButton = document.getElementById("save-changes-btn");
const successNotification = document.getElementById("success-notification");
const mobileMenuToggle = document.getElementById("mobile-menu-toggle");
const mobileNavigation = document.getElementById("mobile-navigation");
const mobileCloseButton = document.getElementById("mobile-close-button");

// Form input elements
const fullNameInput = document.getElementById("full-name");
const emailInput = document.getElementById("email-address");
const phoneInput = document.getElementById("phone-number");
const genderSelect = document.getElementById("gender");

// Error elements
const fullNameError = document.getElementById("full-name-error");
const emailError = document.getElementById("email-error");
const phoneError = document.getElementById("phone-error");
const genderError = document.getElementById("gender-error");

// Profile data state
let profileData = {
  fullName: "Joan Ezekiel",
  email: "joanezekiel@gmail.com",
  phone: "+234 801 456 7890",
  gender: "Female",
  profilePicture: null,
};

// Utility functions
const showInputError = (errorElement, message) => {
  errorElement.textContent = message;
  errorElement.style.display = "block";
};

const clearInputError = (errorElement) => {
  errorElement.textContent = "";
  errorElement.style.display = "none";
};

const clearAllErrors = () => {
  clearInputError(fullNameError);
  clearInputError(emailError);
  clearInputError(phoneError);
  clearInputError(genderError);
};

const setLoadingState = (isLoading) => {
  if (isLoading) {
    saveChangesButton.disabled = true;
    saveChangesButton.textContent = "Saving...";
    profileForm.classList.add("loading");
  } else {
    saveChangesButton.disabled = false;
    saveChangesButton.textContent = "Save Changes";
    profileForm.classList.remove("loading");
  }
};

const showNotification = (message, type = "success") => {
  const notificationMessage = successNotification.querySelector(
    ".notification-message"
  );
  notificationMessage.textContent = message;

  // Update notification styling based on type
  if (type === "success") {
    successNotification.style.backgroundColor = "#10b981";
  } else if (type === "error") {
    successNotification.style.backgroundColor = "#ef4444";
  }

  successNotification.classList.add("show");

  // Auto-hide after 3 seconds
  setTimeout(() => {
    successNotification.classList.remove("show");
  }, 3000);
};

// Form validation
const validateFullName = (fullName) => {
  const trimmedName = fullName.trim();

  if (!trimmedName) {
    return "Full name is required";
  }

  if (trimmedName.length < 2) {
    return "Full name must be at least 2 characters long";
  }

  if (trimmedName.length > 50) {
    return "Full name must be less than 50 characters";
  }

  const namePattern = /^[a-zA-Z\s]+$/;
  if (!namePattern.test(trimmedName)) {
    return "Full name can only contain letters and spaces";
  }

  return null;
};

const validateEmail = (email) => {
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    return "Email address is required";
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(trimmedEmail)) {
    return "Please enter a valid email address";
  }

  return null;
};

const validatePhone = (phone) => {
  const trimmedPhone = phone.trim();

  if (!trimmedPhone) {
    return "Phone number is required";
  }

  // Allow international phone numbers with +, spaces, dashes, and parentheses
  const phonePattern = /^[\+]?[0-9\s\-\(\)]{10,20}$/;
  if (!phonePattern.test(trimmedPhone)) {
    return "Please enter a valid phone number";
  }

  return null;
};

const validateGender = (gender) => {
  if (!gender) {
    return "Please select a gender";
  }

  const validGenders = ["Male", "Female", "Other", "Prefer not to say"];
  if (!validGenders.includes(gender)) {
    return "Please select a valid gender option";
  }

  return null;
};

const validateForm = () => {
  clearAllErrors();

  const fullName = fullNameInput.value;
  const email = emailInput.value;
  const phone = phoneInput.value;
  const gender = genderSelect.value;

  let isValid = true;

  // Validate full name
  const fullNameError = validateFullName(fullName);
  if (fullNameError) {
    showInputError(fullNameError, fullNameError);
    isValid = false;
  }

  // Validate email
  const emailError = validateEmail(email);
  if (emailError) {
    showInputError(emailError, emailError);
    isValid = false;
  }

  // Validate phone
  const phoneError = validatePhone(phone);
  if (phoneError) {
    showInputError(phoneError, phoneError);
    isValid = false;
  }

  // Validate gender
  const genderError = validateGender(gender);
  if (genderError) {
    showInputError(genderError, genderError);
    isValid = false;
  }

  return isValid;
};

// Profile picture handling
const handleProfilePictureUpload = (file) => {
  if (!file) return;

  // Validate file type
  if (!file.type.startsWith("image/")) {
    showNotification("Please select a valid image file", "error");
    return;
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    showNotification("Image file size must be less than 5MB", "error");
    return;
  }

  const reader = new FileReader();

  reader.onload = (event) => {
    profilePictureImage.src = event.target.result;
    profilePictureImage.style.display = "block";
    profilePicturePlaceholder.style.display = "none";
    profileData.profilePicture = file;
  };

  reader.onerror = () => {
    showNotification("Error reading image file", "error");
  };

  reader.readAsDataURL(file);
};

const resetProfilePicture = () => {
  profilePictureImage.style.display = "none";
  profilePicturePlaceholder.style.display = "flex";
  profileData.profilePicture = null;
  profilePictureInput.value = "";
};

// Simulate API call for saving profile
const saveProfileData = async (data) => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // In real app, this would be an API call
  console.log("Saving profile data:", data);

  // Simulate success
  return { success: true, message: "Profile updated successfully!" };
};

const handleFormSubmission = async (event) => {
  event.preventDefault();

  if (!validateForm()) {
    return;
  }

  setLoadingState(true);

  try {
    const formData = {
      fullName: fullNameInput.value.trim(),
      email: emailInput.value.trim(),
      phone: phoneInput.value.trim(),
      gender: genderSelect.value,
      profilePicture: profileData.profilePicture,
    };

    const result = await saveProfileData(formData);

    if (result.success) {
      // Update local state
      profileData = { ...profileData, ...formData };

      // Show success notification
      showNotification(result.message);

      // Clear any existing errors
      clearAllErrors();
    } else {
      showNotification("Failed to update profile. Please try again.", "error");
    }
  } catch (error) {
    console.error("Error saving profile:", error);
    showNotification("An error occurred. Please try again.", "error");
  } finally {
    setLoadingState(false);
  }
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

// Real-time validation
const handleInputChange = (input, validator, errorElement) => {
  const value = input.value;
  const error = validator(value);

  if (error) {
    showInputError(errorElement, error);
  } else {
    clearInputError(errorElement);
  }
};

// Keyboard shortcuts
const handleKeyboardShortcuts = (event) => {
  // Ctrl/Cmd + S to save
  if ((event.ctrlKey || event.metaKey) && event.key === "s") {
    event.preventDefault();
    profileForm.dispatchEvent(new Event("submit"));
  }

  // Escape to close mobile menu
  if (event.key === "Escape") {
    closeMobileMenu();
  }
};

// Initialize page
const initializePage = () => {
  // Clear any existing errors
  clearAllErrors();

  // Add smooth scrolling for better UX
  document.documentElement.style.scrollBehavior = "smooth";
};

// Event Listeners
profileForm.addEventListener("submit", handleFormSubmission);
uploadButton.addEventListener("click", () => profilePictureInput.click());
profilePictureInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  handleProfilePictureUpload(file);
});

// Real-time validation
fullNameInput.addEventListener("input", () => {
  handleInputChange(fullNameInput, validateFullName, fullNameError);
});

emailInput.addEventListener("input", () => {
  handleInputChange(emailInput, validateEmail, emailError);
});

phoneInput.addEventListener("input", () => {
  handleInputChange(phoneInput, validatePhone, phoneError);
});

genderSelect.addEventListener("change", () => {
  handleInputChange(genderSelect, validateGender, genderError);
});

// Mobile menu events
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
    fullNameInput.focus();
  }
});

// Export functions for testing (if needed)
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    validateFullName,
    validateEmail,
    validatePhone,
    validateGender,
    handleProfilePictureUpload,
    saveProfileData,
    showNotification,
  };
}
