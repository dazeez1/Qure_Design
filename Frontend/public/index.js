"use strict";

const mobileMenuToggle = document.getElementById("mobile-menu-toggle");
const mobileNavigation = document.getElementById("mobile-navigation");
const mobileCloseButton = document.getElementById("mobile-close-button");

if (!mobileMenuToggle || !mobileNavigation || !mobileCloseButton) {
  console.warn("Mobile nav elements missing:", {
    mobileMenuToggle,
    mobileNavigation,
    mobileCloseButton,
  });
}

function openMenu() {
  mobileNavigation.classList.add("active");
  mobileMenuToggle.classList.add("active");
  mobileMenuToggle.setAttribute("aria-expanded", "true");
  document.body.style.overflow = "hidden";
}

function closeMenu() {
  mobileNavigation.classList.remove("active");
  mobileMenuToggle.classList.remove("active");
  mobileMenuToggle.setAttribute("aria-expanded", "false");
  document.body.style.overflow = "";
}

mobileMenuToggle.addEventListener("click", openMenu);
mobileCloseButton.addEventListener("click", closeMenu);

mobileNavigation.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", closeMenu);
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && mobileNavigation.classList.contains("active")) {
    closeMenu();
  }
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 768) {
    closeMenu();
  }
});
