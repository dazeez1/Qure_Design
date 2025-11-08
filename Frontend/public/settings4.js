"use strict";
document.addEventListener("DOMContentLoaded", () => {
  const saveBtn = document.getElementById("save-btn");
  const cancelBtn = document.getElementById("cancel-btn");

  const popupSave = document.getElementById("popup-save");
  const closeSave = document.getElementById("close-save");

  const popupCancel = document.getElementById("popup-cancel");
  const confirmCancel = document.getElementById("confirm-cancel");
  const closeCancel = document.getElementById("close-cancel");

  const popupCancelled = document.getElementById("popup-cancelled");
  const closeCancelled = document.getElementById("close-cancelled");

  saveBtn.addEventListener("click", () => {
    popupSave.style.display = "flex";
  });

  closeSave.addEventListener("click", () => {
    popupSave.style.display = "none";
  });

  popupSave.addEventListener("click", (e) => {
    if (e.target === popupSave) {
      popupSave.style.display = "none";
    }
  });

  cancelBtn.addEventListener("click", () => {
    popupCancel.style.display = "flex";
  });

  closeCancel.addEventListener("click", () => {
    popupCancel.style.display = "none";
  });

  confirmCancel.addEventListener("click", () => {
    popupCancel.style.display = "none";
    popupCancelled.style.display = "flex";
  });

  closeCancelled.addEventListener("click", () => {
    popupCancelled.style.display = "none";
  });

  popupCancel.addEventListener("click", (e) => {
    if (e.target === popupCancel) {
      popupCancel.style.display = "none";
    }
  });

  popupCancelled.addEventListener("click", (e) => {
    if (e.target === popupCancelled) {
      popupCancelled.style.display = "none";
    }
  });
});
