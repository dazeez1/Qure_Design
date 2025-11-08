import express from "express";
import { authenticateToken, requireRole } from "../middlewares/auth.js";
import {
  joinQueue,
  getQueueStatus,
  leaveQueue,
  getQueueHistory,
  getHospitalQueues,
  callNextPatient,
  callSpecificPatient,
  completeCurrentPatient,
  completeSpecificPatient,
  getAllQueues,
  debugAllQueues,
  notifySelectedPatients,
  assignRoomToPatients,
  markPatientsNoShow,
} from "../controllers/queueController.js";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Patient routes
router.post("/join", requireRole("patient"), joinQueue);
router.get("/status", requireRole("patient"), getQueueStatus);
router.delete("/leave", requireRole("patient"), leaveQueue);
router.get("/history", requireRole("patient"), getQueueHistory);
// Only patients can view public all-queues data
router.get("/all", requireRole("patient"), getAllQueues);
router.get("/debug", authenticateToken, debugAllQueues);

// Staff routes
router.get("/hospital", requireRole("staff"), getHospitalQueues);
router.post("/call-next", requireRole("staff"), callNextPatient);
router.post("/call-specific", requireRole("staff"), callSpecificPatient);
router.post("/complete", requireRole("staff"), completeCurrentPatient);
router.post(
  "/complete-specific",
  requireRole("staff"),
  completeSpecificPatient
);
router.post("/notify", requireRole("staff"), notifySelectedPatients);
router.post("/assign-room", requireRole("staff"), assignRoomToPatients);
router.post("/no-show", requireRole("staff"), markPatientsNoShow);

export { router as queueRouter };
