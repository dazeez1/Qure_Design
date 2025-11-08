import express from "express";
import { authenticateToken, requireRole } from "../middlewares/auth.js";
import {
  createAccessCode,
  getAllAccessCodes,
  getAccessCodeById,
  updateAccessCode,
  deleteAccessCode,
  getAccessCodeStats,
} from "../controllers/accessCodeController.js";

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(requireRole("staff")); // Only staff can manage access codes

// Access code management routes
router.post("/", createAccessCode);
router.get("/", getAllAccessCodes);
router.get("/stats", getAccessCodeStats);
router.get("/:id", getAccessCodeById);
router.put("/:id", updateAccessCode);
router.delete("/:id", deleteAccessCode);

export { router as accessCodeRouter };
