"use strict";

// DOM Elements
const mobileMenuToggle = document.getElementById("mobile-menu-toggle");
const mobileNavigation = document.getElementById("mobile-navigation");
const mobileCloseButton = document.getElementById("mobile-close-button");
const contactForm = document.getElementById("contact-form");
const successModal = document.getElementById("success-modal");
const modalClose = document.getElementById("modal-close");
const closeModalBtn = document.getElementById("close-modal-btn");

// Form Elements
const contactName = document.getElementById("contact-name");
const contactEmail = document.getElementById("contact-email");
const contactMessage = document.getElementById("contact-message");
const submitContactBtn = document.getElementById("submit-contact-btn");

// Modal Elements
const modalMessage = document.getElementById("modal-message");

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

// Form Validation
const validateForm = () => {
  let isValid = true;
  const errors = [];

  // Name validation
  if (!contactName.value.trim()) {
    errors.push("Please enter your name");
    isValid = false;
  } else if (contactName.value.trim().length < 2) {
    errors.push("Name must be at least 2 characters long");
    isValid = false;
  }

  // Email validation
  if (!contactEmail.value.trim()) {
    errors.push("Please enter your email address");
    isValid = false;
  } else if (!isValidEmail(contactEmail.value.trim())) {
    errors.push("Please enter a valid email address");
    isValid = false;
  }

  // Message validation
  if (!contactMessage.value.trim()) {
    errors.push("Please enter your message");
    isValid = false;
  } else if (contactMessage.value.trim().length < 10) {
    errors.push("Message must be at least 10 characters long");
    isValid = false;
  } else if (contactMessage.value.length > 1000) {
    errors.push("Message cannot exceed 1000 characters");
    isValid = false;
  }

  return { isValid, errors };
};

// Email validation helper
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Show form errors
const showFormErrors = (errors) => {
  // Clear previous errors
  clearFormErrors();

  // Show error message
  const errorDiv = document.createElement("div");
  errorDiv.className = "form-error";
  errorDiv.style.cssText = `
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    color: #dc2626;
    padding: 1rem;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
    font-size: 1.4rem;
  `;

  errorDiv.innerHTML = `
    <strong>Please fix the following errors:</strong>
    <ul style="margin: 0.5rem 0 0 1.5rem;">
      ${errors.map((error) => `<li>${error}</li>`).join("")}
    </ul>
  `;

  contactForm.insertBefore(errorDiv, contactForm.firstChild);
};

// Clear form errors
const clearFormErrors = () => {
  const existingError = contactForm.querySelector(".form-error");
  if (existingError) {
    existingError.remove();
  }
};

// Handle form submission
const handleFormSubmit = async (e) => {
  e.preventDefault();

  const validation = validateForm();

  if (!validation.isValid) {
    showFormErrors(validation.errors);
    return;
  }

  // Show loading state
  submitContactBtn.disabled = true;
  submitContactBtn.textContent = "Sending...";

  try {
    // Prepare contact data
    const contactData = {
      name: contactName.value.trim(),
      email: contactEmail.value.trim(),
      message: contactMessage.value.trim(),
      subject: "Contact Form Submission",
      category: "general",
      source: "website",
    };

    console.log("Submitting contact message:", contactData);

    // Submit to API
    const response = await fetch(
      "https://qure-design.onrender.com/api/contact",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(contactData),
      }
    );

    const result = await response.json();

    if (response.ok && result.success) {
      // Show success modal
      showSuccessModal();

      // Reset form
      resetForm();

      console.log("Contact message sent successfully:", result.data);
    } else {
      // Show error message
      showFormErrors([
        result.message || "Failed to send message. Please try again.",
      ]);
      console.error("Contact submission error:", result);
    }
  } catch (error) {
    console.error("Error submitting contact message:", error);
    showFormErrors([
      "Network error. Please check your connection and try again.",
    ]);
  } finally {
    // Reset button
    submitContactBtn.disabled = false;
    submitContactBtn.textContent = "Submit";
  }
};

// Reset form
const resetForm = () => {
  contactName.value = "";
  contactEmail.value = "";
  contactMessage.value = "";

  // Clear errors
  clearFormErrors();

  // Reset focus
  contactName.focus();
};

// Show success modal
const showSuccessModal = () => {
  // Update modal content with message preview
  const messagePreview = contactMessage.value.trim().substring(0, 100);
  modalMessage.textContent =
    messagePreview + (contactMessage.value.length > 100 ? "..." : "");

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
closeModalBtn.addEventListener("click", hideSuccessModal);

// Close modal when clicking outside
successModal.addEventListener("click", (e) => {
  if (e.target === successModal) {
    hideSuccessModal();
  }
});

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  console.log("Contact Us page loaded successfully");

  // Set initial focus
  contactName.focus();
});

// Event listeners
contactForm.addEventListener("submit", handleFormSubmit);

// Handle window resize for responsive behavior
window.addEventListener("resize", () => {
  if (window.innerWidth > 768) {
    closeMobileMenu();
  }
});

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

// Removed localStorage autosave/restore for contact form.

// Add keyboard navigation for better accessibility
const handleFormKeyboard = (e) => {
  if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") {
    e.preventDefault();
    const formElements = [contactName, contactEmail, contactMessage];
    const currentIndex = formElements.indexOf(e.target);

    if (currentIndex < formElements.length - 1) {
      formElements[currentIndex + 1].focus();
    } else {
      submitContactBtn.click();
    }
  }
};

// Add keyboard event listeners to form inputs
[contactName, contactEmail, contactMessage].forEach((input) => {
  input.addEventListener("keydown", handleFormKeyboard);
});

// Add accessibility improvements
const improveAccessibility = () => {
  // Add ARIA labels
  contactName.setAttribute("aria-label", "Enter your full name");
  contactEmail.setAttribute("aria-label", "Enter your email address");
  contactMessage.setAttribute("aria-label", "Describe your issue or inquiry");
  submitContactBtn.setAttribute("aria-label", "Submit your message");

  // Add live region for form validation
  const liveRegion = document.createElement("div");
  liveRegion.setAttribute("aria-live", "polite");
  liveRegion.setAttribute("aria-atomic", "true");
  liveRegion.className = "sr-only";
  liveRegion.style.cssText = `
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  `;

  document.body.appendChild(liveRegion);

  // Update live region when form is submitted
  const originalHandleFormSubmit = handleFormSubmit;
  handleFormSubmit = function (e) {
    const result = originalHandleFormSubmit.call(this, e);
    if (result && result.isValid) {
      liveRegion.textContent = "Form submitted successfully";
    } else if (result && !result.isValid) {
      liveRegion.textContent = `Form has ${result.errors.length} validation errors`;
    }
  };
};

// Initialize accessibility improvements
document.addEventListener("DOMContentLoaded", improveAccessibility);

// Add input validation feedback
const addInputValidation = () => {
  const inputs = [contactName, contactEmail, contactMessage];

  inputs.forEach((input) => {
    input.addEventListener("blur", () => {
      validateField(input);
    });

    input.addEventListener("input", () => {
      clearFieldError(input);
    });
  });
};

// Validate individual field
const validateField = (field) => {
  let isValid = true;
  let errorMessage = "";

  if (field === contactName) {
    if (!field.value.trim()) {
      isValid = false;
      errorMessage = "Name is required";
    } else if (field.value.trim().length < 2) {
      isValid = false;
      errorMessage = "Name must be at least 2 characters";
    }
  } else if (field === contactEmail) {
    if (!field.value.trim()) {
      isValid = false;
      errorMessage = "Email is required";
    } else if (!isValidEmail(field.value.trim())) {
      isValid = false;
      errorMessage = "Please enter a valid email";
    }
  } else if (field === contactMessage) {
    if (!field.value.trim()) {
      isValid = false;
      errorMessage = "Message is required";
    } else if (field.value.trim().length < 10) {
      isValid = false;
      errorMessage = "Message must be at least 10 characters";
    }
  }

  if (!isValid) {
    showFieldError(field, errorMessage);
  }
};

// Show field error
const showFieldError = (field, message) => {
  clearFieldError(field);

  const errorDiv = document.createElement("div");
  errorDiv.className = "field-error";
  errorDiv.style.cssText = `
    color: #dc2626;
    font-size: 1.2rem;
    margin-top: 0.4rem;
    display: flex;
    align-items: center;
    gap: 0.4rem;
  `;

  errorDiv.innerHTML = `
    <span style="color: #dc2626;">⚠</span>
    ${message}
  `;

  field.parentNode.appendChild(errorDiv);
  field.style.borderColor = "#dc2626";
};

// Clear field error
const clearFieldError = (field) => {
  const existingError = field.parentNode.querySelector(".field-error");
  if (existingError) {
    existingError.remove();
  }
  field.style.borderColor = "#d1d5db";
};

// Initialize input validation
document.addEventListener("DOMContentLoaded", addInputValidation);

// Add character counter for message field
const addMessageCounter = () => {
  const counter = document.createElement("div");
  counter.className = "message-counter";
  counter.style.cssText = `
    text-align: right;
    font-size: 1.2rem;
    color: #64748b;
    margin-top: 0.4rem;
  `;

  contactMessage.parentNode.appendChild(counter);

  const updateCounter = () => {
    const currentLength = contactMessage.value.length;
    const maxLength = 1000;
    const remaining = maxLength - currentLength;

    counter.textContent = `${currentLength}/${maxLength}`;

    if (remaining < 100) {
      counter.style.color = "#dc2626";
    } else if (remaining < 200) {
      counter.style.color = "#f59e0b";
    } else {
      counter.style.color = "#64748b";
    }
  };

  contactMessage.addEventListener("input", updateCounter);
  updateCounter(); // Initial count
};

// Initialize message counter
document.addEventListener("DOMContentLoaded", addMessageCounter);
