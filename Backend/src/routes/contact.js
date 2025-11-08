import express from "express";
import {
  createContact,
  getAllContacts,
  getContactById,
  updateContact,
  respondToContact,
  deleteContact,
  getContactStats,
  markContactAsRead,
} from "../controllers/contactController.js";
import { authenticateToken, requireRole } from "../middlewares/auth.js";

const router = express.Router();

// Public route - anyone can submit a contact message
router.post("/", createContact);

// Staff/Admin routes - require authentication and staff role
router.get("/", authenticateToken, requireRole("staff"), getAllContacts);
router.get("/stats", authenticateToken, requireRole("staff"), getContactStats);
router.get("/:id", authenticateToken, requireRole("staff"), getContactById);
router.patch("/:id", authenticateToken, requireRole("staff"), updateContact);
router.patch(
  "/:id/respond",
  authenticateToken,
  requireRole("staff"),
  respondToContact
);
router.patch(
  "/:id/read",
  authenticateToken,
  requireRole("staff"),
  markContactAsRead
);
router.delete("/:id", authenticateToken, requireRole("staff"), deleteContact);

export default router;
