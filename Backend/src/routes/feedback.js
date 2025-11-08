import express from "express";
import {
  createFeedback,
  getUserFeedback,
  getAllFeedback,
  getFeedbackStats,
  updateFeedbackStatus,
  deleteFeedback,
} from "../controllers/feedbackController.js";
import { authenticateToken, requireRole } from "../middlewares/auth.js";

const router = express.Router();

// Patient routes
router.post("/", authenticateToken, requireRole("patient"), createFeedback);
router.get(
  "/my-feedback",
  authenticateToken,
  requireRole("patient"),
  getUserFeedback
);
router.delete(
  "/:id",
  authenticateToken,
  requireRole("patient"),
  deleteFeedback
);

// Staff/Admin routes
router.get("/", authenticateToken, requireRole("staff"), getAllFeedback);
router.get("/stats", authenticateToken, requireRole("staff"), getFeedbackStats);
router.patch(
  "/:id/status",
  authenticateToken,
  requireRole("staff"),
  updateFeedbackStatus
);

export default router;
