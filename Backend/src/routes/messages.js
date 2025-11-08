import express from "express";
import {
  sendMessage,
  getPatientMessages,
  getHospitalMessages,
  markMessageAsRead,
  getUnreadMessageCount,
} from "../controllers/messageController.js";
import { authenticateToken, requireRole } from "../middlewares/auth.js";

const router = express.Router();

// ===== Staff Routes =====
router.post("/send", authenticateToken, requireRole("staff"), sendMessage);
router.get(
  "/hospital",
  authenticateToken,
  requireRole("staff"),
  getHospitalMessages
);

// ===== Patient Routes =====
router.get(
  "/appointment/:appointmentId",
  authenticateToken,
  getPatientMessages
);
router.put("/:messageId/read", authenticateToken, markMessageAsRead);
router.get("/unread-count", authenticateToken, getUnreadMessageCount);

export default router;
