import express from "express";
import { authenticateToken, requireRole } from "../middlewares/auth.js";
import {
  createAppointment,
  getUserAppointments,
  updateAppointment,
  cancelAppointment,
  getAppointment,
  getHospitalAppointments,
  updateAppointmentStatus,
  createStaffAppointment,
  rescheduleAppointment,
  editAppointment,
} from "../controllers/appointmentController.js";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Patient routes
router.post("/", requireRole("patient"), createAppointment);
router.get("/", requireRole("patient"), getUserAppointments);
router.get("/:id", requireRole("patient"), getAppointment);
router.put("/:id", requireRole("patient"), updateAppointment);
router.delete("/:id", requireRole("patient"), cancelAppointment);

// Staff routes
router.get("/hospital/all", requireRole("staff"), getHospitalAppointments);
router.post("/staff/create", requireRole("staff"), createStaffAppointment);
router.put("/staff/:id/status", requireRole("staff"), updateAppointmentStatus);
router.put(
  "/staff/:id/reschedule",
  requireRole("staff"),
  rescheduleAppointment
);
router.put("/staff/:id/edit", requireRole("staff"), editAppointment);

export { router as appointmentRouter };
