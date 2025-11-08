"use strict";

// DOM Elements
const mobileMenuToggle = document.getElementById("mobile-menu-toggle");
const mobileNavigation = document.getElementById("mobile-navigation");
const mobileCloseButton = document.getElementById("mobile-close-button");
const feedbackForm = document.getElementById("feedback-form");
const successModal = document.getElementById("success-modal");
const modalClose = document.getElementById("modal-close");
const closeModalBtn = document.getElementById("close-modal-btn");
const feedbackList = document.getElementById("feedback-list");

// Form Elements
const starRating = document.getElementById("star-rating");
const ratingText = document.getElementById("rating-text");
const feedbackComments = document.getElementById("feedback-comments");
const charCount = document.getElementById("char-count");
const submitFeedbackBtn = document.getElementById("submit-feedback-btn");

// Modal Elements
const modalRating = document.getElementById("modal-rating");
const modalComment = document.getElementById("modal-comment");

// Sample feedback data
const sampleFeedback = [
  {
    id: 1,
    patientName: "Obi Fredricks",
    rating: 5,
    visitDate: "April 25",
    visitType: "Visits Doctor",
    doctorName: "Dr. Babarinde",
    specialty: "Pediatrics",
  },
  {
    id: 2,
    patientName: "Adewale John",
    rating: 4,
    visitDate: "April 28",
    visitType: "Visits Doctor",
    doctorName: "Dr. Falana",
    specialty: "Dermatology",
  },
  {
    id: 3,
    patientName: "Richard Oladipo",
    rating: 3,
    visitDate: "April 30",
    visitType: "Visits Doctor",
    doctorName: "Dr. David",
    specialty: "Consultant",
  },
];

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

// Star Rating Functionality
let selectedRating = 0;

const updateRatingText = (rating) => {
  const ratingMessages = {
    1: "Poor - We're sorry to hear that",
    2: "Fair - We'll work to improve",
    3: "Good - Thank you for your feedback",
    4: "Very Good - We're glad you had a good experience",
    5: "Excellent - We're thrilled you had an amazing experience!",
  };

  ratingText.textContent = ratingMessages[rating] || "Select a rating";
  ratingText.style.color =
    rating >= 4 ? "#10b981" : rating >= 3 ? "#f59e0b" : "#dc2626";
};

const handleStarClick = (rating) => {
  selectedRating = rating;

  // Update visual state
  document.querySelectorAll(".star").forEach((star, index) => {
    if (index < rating) {
      star.style.color = "#fbbf24";
    } else {
      star.style.color = "#d1d5db";
    }
  });

  updateRatingText(rating);
};

// Add click event listeners to stars
document.querySelectorAll(".star").forEach((star, index) => {
  star.addEventListener("click", () => {
    handleStarClick(index + 1);
  });
});

// Character Counter for Comments
const updateCharCount = () => {
  const currentLength = feedbackComments.value.length;
  const maxLength = 500;

  charCount.textContent = currentLength;

  if (currentLength > maxLength * 0.9) {
    charCount.style.color = "#dc2626";
  } else if (currentLength > maxLength * 0.7) {
    charCount.style.color = "#f59e0b";
  } else {
    charCount.style.color = "#64748b";
  }

  // Disable submit button if over limit
  if (currentLength > maxLength) {
    submitFeedbackBtn.disabled = true;
    submitFeedbackBtn.textContent = "Comment too long";
  } else {
    submitFeedbackBtn.disabled = false;
    submitFeedbackBtn.textContent = "Submit";
  }
};

feedbackComments.addEventListener("input", updateCharCount);

// Form Validation
const validateForm = () => {
  let isValid = true;
  const errors = [];

  if (selectedRating === 0) {
    errors.push("Please select a rating");
    isValid = false;
  }

  if (!feedbackComments.value.trim()) {
    errors.push("Please provide feedback comments");
    isValid = false;
  }

  if (feedbackComments.value.trim().length < 10) {
    errors.push("Comments must be at least 10 characters long");
    isValid = false;
  }

  if (feedbackComments.value.length > 500) {
    errors.push("Comments cannot exceed 500 characters");
    isValid = false;
  }

  return { isValid, errors };
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

  feedbackForm.insertBefore(errorDiv, feedbackForm.firstChild);
};

// Clear form errors
const clearFormErrors = () => {
  const existingError = feedbackForm.querySelector(".form-error");
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

  // Check authentication
  const token = localStorage.getItem("authToken");
  if (!token) {
    showFormErrors(["Please log in to submit feedback"]);
    return;
  }

  // Show loading state
  submitFeedbackBtn.disabled = true;
  submitFeedbackBtn.textContent = "Submitting...";

  try {
    // Prepare feedback data
    const feedbackData = {
      rating: selectedRating,
      comments: feedbackComments.value.trim(),
      visitType: "general", // Default for now
      isAnonymous: false,
    };

    console.log("Submitting feedback:", feedbackData);

    // Submit to API
    const response = await fetch(
      "https://qure-design.onrender.com/api/feedback",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(feedbackData),
      }
    );

    const result = await response.json();

    if (response.ok && result.success) {
      // Show success modal
      showSuccessModal();

      // Reset form
      resetForm();

      // Refresh feedback list
      loadUserFeedback();
    } else {
      throw new Error(result.message || "Failed to submit feedback");
    }
  } catch (error) {
    console.error("Error submitting feedback:", error);
    showFormErrors([`Failed to submit feedback: ${error.message}`]);
  } finally {
    // Reset button
    submitFeedbackBtn.disabled = false;
    submitFeedbackBtn.textContent = "Submit";
  }
};

// Reset form
const resetForm = () => {
  selectedRating = 0;
  feedbackComments.value = "";

  // Reset stars
  document.querySelectorAll(".star").forEach((star) => {
    star.style.color = "#d1d5db";
  });

  // Reset rating text
  ratingText.textContent = "Select a rating";
  ratingText.style.color = "#64748b";

  // Reset character count
  updateCharCount();

  // Clear errors
  clearFormErrors();
};

// Show success modal
const showSuccessModal = () => {
  // Update modal content
  modalRating.innerHTML = generateStarRating(selectedRating);
  modalComment.textContent = feedbackComments.value.trim();

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

// Generate star rating HTML
const generateStarRating = (rating) => {
  let starsHTML = "";
  for (let i = 1; i <= 5; i++) {
    const starClass = i <= rating ? "feedback-star" : "feedback-star outline";
    starsHTML += `<span class="${starClass}">★</span>`;
  }
  return starsHTML;
};

// Generate feedback item HTML
const generateFeedbackItem = (feedback) => {
  return `
    <div class="feedback-item">
      <div class="feedback-header">
        <div class="patient-info">
          <div class="patient-name">${feedback.patientName}</div>
          <div class="visit-details">${feedback.visitDate} ${
    feedback.visitType
  }</div>
        </div>
        <div class="doctor-info">${feedback.doctorName} ${
    feedback.specialty
  }</div>
      </div>
      <div class="feedback-rating">
        ${generateStarRating(feedback.rating)}
      </div>
    </div>
  `;
};

// Load user feedback from API
const loadUserFeedback = async () => {
  const token = localStorage.getItem("authToken");
  if (!token) {
    console.log("No token found, showing sample feedback");
    populateFeedbackList();
    return;
  }

  try {
    const response = await fetch(
      "https://qure-design.onrender.com/api/feedback/my-feedback",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const result = await response.json();

    if (response.ok && result.success) {
      const userFeedback = result.data.feedback;
      if (userFeedback.length > 0) {
        feedbackList.innerHTML = userFeedback
          .map((feedback) => ({
            id: feedback.id,
            patientName: feedback.patientName || "You",
            rating: feedback.rating,
            visitDate: new Date(feedback.visitDate).toLocaleDateString(),
            visitType: feedback.visitType,
            doctorName: feedback.doctorName || "N/A",
            specialty: feedback.specialty || "General",
          }))
          .map(generateFeedbackItem)
          .join("");
      } else {
        feedbackList.innerHTML = `
          <div class="no-feedback">
            <p>No feedback submitted yet. Be the first to share your experience!</p>
          </div>
        `;
      }
    } else {
      throw new Error(result.message || "Failed to load feedback");
    }
  } catch (error) {
    console.error("Error loading user feedback:", error);
    // Fallback to sample feedback
    populateFeedbackList();
  }
};

// Populate feedback list with sample data
const populateFeedbackList = () => {
  feedbackList.innerHTML = sampleFeedback.map(generateFeedbackItem).join("");
};

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  console.log("Feedback & Ratings page loaded successfully");

  // Load user feedback from API
  loadUserFeedback();

  // Set initial character count
  updateCharCount();
});

// Event listeners
feedbackForm.addEventListener("submit", handleFormSubmit);

// Handle window resize for responsive behavior
window.addEventListener("resize", () => {
  if (window.innerWidth > 768) {
    closeMobileMenu();
  }
});

// Enhanced star rating interactions
const enhanceStarRating = () => {
  const stars = document.querySelectorAll(".star");

  stars.forEach((star, index) => {
    // Hover effects
    star.addEventListener("mouseenter", () => {
      // Highlight current star and all previous stars
      stars.forEach((s, i) => {
        if (i <= index) {
          s.style.color = "#fbbf24";
          s.style.transform = "scale(1.1)";
        }
      });
    });

    star.addEventListener("mouseleave", () => {
      // Reset to selected state
      stars.forEach((s, i) => {
        if (i < selectedRating) {
          s.style.color = "#fbbf24";
        } else {
          s.style.color = "#d1d5db";
        }
        s.style.transform = "scale(1)";
      });
    });
  });
};

// Initialize enhanced interactions
document.addEventListener("DOMContentLoaded", enhanceStarRating);

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

// Removed localStorage autosave/restore for feedback form.

// Add keyboard navigation for star rating
const handleStarKeyboard = (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    const star = e.target;
    const rating = parseInt(star.getAttribute("for").split("-")[1]);
    handleStarClick(rating);
  }
};

// Add keyboard event listeners to stars
document.querySelectorAll(".star").forEach((star) => {
  star.setAttribute("tabindex", "0");
  star.setAttribute("role", "button");
  star.setAttribute("aria-label", "Rate this service");
  star.addEventListener("keydown", handleStarKeyboard);
});

// Add accessibility improvements
const improveAccessibility = () => {
  // Add ARIA labels
  feedbackComments.setAttribute("aria-label", "Share your experience with us");
  submitFeedbackBtn.setAttribute("aria-label", "Submit feedback");

  // Add live region for rating updates
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

  // Update live region when rating changes
  const originalUpdateRatingText = updateRatingText;
  updateRatingText = function (rating) {
    originalUpdateRatingText.call(this, rating);
    liveRegion.textContent = `Rating selected: ${rating} stars`;
  };
};

// Initialize accessibility improvements
document.addEventListener("DOMContentLoaded", improveAccessibility);
