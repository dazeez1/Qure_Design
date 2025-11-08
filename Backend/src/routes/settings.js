import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.js";
import {
  // Organization Settings
  getOrganizationSettings,
  updateOrganizationSettings,
  
  // Departments Management
  getDepartments,
  getPublicDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  
  // Staff Activity Tracking
  getStaffWithActivity,
  trackStaffLogin,
  trackStaffLogout,
} from "../controllers/settingsController.js";

import {
  // Notification Settings
  getNotificationSettings,
  updateNotificationSettings,
  sendTestNotification,
  triggerAppointmentReminders,
} from "../controllers/notificationSettingsController.js";

const router = Router();

// ===== PUBLIC DEPARTMENTS ROUTE (for patients) - No auth required =====
router.get("/departments/public", getPublicDepartments);

// Apply authentication middleware to all other routes
router.use(authenticateToken);

// ===== ORGANIZATION SETTINGS ROUTES =====
router.get("/organization", getOrganizationSettings);
router.put("/organization", updateOrganizationSettings);

// ===== DEPARTMENTS MANAGEMENT ROUTES =====
router.get("/departments", getDepartments);
router.post("/departments", createDepartment);
router.put("/departments/:id", updateDepartment);
router.delete("/departments/:id", deleteDepartment);

// ===== STAFF ACTIVITY TRACKING ROUTES =====
router.get("/staff", getStaffWithActivity);
router.post("/staff/login", trackStaffLogin);
router.post("/staff/logout", trackStaffLogout);

// ===== NOTIFICATION SETTINGS ROUTES =====
router.get("/notifications", getNotificationSettings);
router.put("/notifications", updateNotificationSettings);
router.post("/notifications/test", sendTestNotification);
router.post("/notifications/trigger-reminders", triggerAppointmentReminders);

export { router as settingsRouter };
