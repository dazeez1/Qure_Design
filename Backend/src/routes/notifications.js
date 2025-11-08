import express from "express";
import { authenticateToken } from "../middlewares/auth.js";
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  createNotification,
  getNotificationPreferences,
  updateNotificationPreferences,
} from "../controllers/notificationController.js";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// User routes (both patients and staff)
router.get("/", getUserNotifications);
router.get("/preferences", getNotificationPreferences);
router.put("/preferences", updateNotificationPreferences);
router.put("/:id/read", markNotificationAsRead);
router.put("/read-all", markAllNotificationsAsRead);
router.delete("/:id", deleteNotification);
router.post("/", createNotification);

export { router as notificationRouter };
