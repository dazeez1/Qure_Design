import express from "express";
import { authenticateToken, requireRole } from "../middlewares/auth.js";
import {
  getWaitingRooms,
  getWaitingRoomDetails,
  createWaitingRoom,
  updateWaitingRoom,
  deleteWaitingRoom,
  notifyWaitingRoom,
  updateOccupancy,
} from "../controllers/waitingRoomController.js";

const router = express.Router();

// All routes require authentication and staff role
router.use(authenticateToken);
router.use(requireRole("staff"));

// Get all waiting rooms for the staff's hospital
router.get("/", getWaitingRooms);

// Get specific waiting room details with patient list
router.get("/:roomId", getWaitingRoomDetails);

// Create new waiting room
router.post("/", createWaitingRoom);

// Update waiting room
router.put("/:roomId", updateWaitingRoom);

// Delete waiting room (soft delete)
router.delete("/:roomId", deleteWaitingRoom);

// Send notification to patients in waiting room
router.post("/:roomId/notify", notifyWaitingRoom);

// Update waiting room occupancy manually
router.put("/:roomId/occupancy", updateOccupancy);

export { router as waitingRoomRouter };
