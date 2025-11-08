import { Queue } from "../models/Queue.js";
import { Notification } from "../models/Notification.js";
import { User } from "../models/User.js";
import { z } from "zod";
import { webSocketService } from "../services/websocket.js";

// Validation schemas
const joinQueueSchema = z.object({
  hospitalName: z.string().min(1, "Hospital name is required"),
  specialty: z.string().min(1, "Specialty is required"),
  notes: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
});

// Join queue
export const joinQueue = async (req, res) => {
  try {
    const userId = req.user.id;
    const data = joinQueueSchema.parse(req.body);

    // Check if user is already in a queue
    const existingQueue = await Queue.findOne({
      patient: userId,
      status: { $in: ["waiting", "called"] },
    });

    if (existingQueue) {
      return res.status(400).json({
        success: false,
        message: "You are already in a queue",
        data: existingQueue,
      });
    }

    // Get the next position in the queue (highest position number + 1)
    const lastQueue = await Queue.findOne({
      hospitalName: data.hospitalName,
      specialty: data.specialty,
      status: { $in: ["waiting", "called"] }, // Include called patients in position calculation
    }).sort({ position: -1 });

    const nextPosition = lastQueue ? lastQueue.position + 1 : 1;
    const queueNumber = `${data.specialty.charAt(0).toUpperCase()}-${String(
      nextPosition
    ).padStart(3, "0")}`;

    // Calculate estimated wait time (rough estimate: 15 minutes per person)
    const estimatedWaitTime = (nextPosition - 1) * 15;

    const queue = new Queue({
      ...data,
      patient: userId,
      position: nextPosition,
      queueNumber,
      estimatedWaitTime,
    });

    await queue.save();

    // Create notification
    await Notification.create({
      user: userId,
      title: "Joined Queue",
      message: `You have joined the ${data.specialty} queue at ${data.hospitalName}. Your queue number is ${queueNumber}.`,
      type: "queue_update",
      relatedEntity: {
        type: "queue",
        id: queue._id,
      },
    });

    // Update user's preferredHospital when joining a queue
    try {
      const { User } = await import("../models/User.js");
      await User.findByIdAndUpdate(userId, {
        $set: { preferredHospital: data.hospitalName },
      });
    } catch (_) {}

    // Broadcast queue update to hospital staff
    webSocketService.broadcastQueueUpdate(data.hospitalName, {
      type: "patient_joined",
      queue: await queue.populate("patient", "firstName lastName"),
      timestamp: new Date(),
    });

    res.status(201).json({
      success: true,
      message: "Successfully joined the queue",
      data: queue,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    }

    console.error("Join queue error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get user's queue status
export const getQueueStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const queue = await Queue.findOne({
      patient: userId,
      status: { $in: ["waiting", "called"] },
    }).populate("patient", "firstName lastName email phone");

    if (!queue) {
      return res.status(404).json({
        success: false,
        message: "You are not currently in any queue",
      });
    }

    // Get queue statistics
    const totalInQueue = await Queue.countDocuments({
      hospitalName: queue.hospitalName,
      specialty: queue.specialty,
      status: "waiting",
    });

    const aheadInQueue = await Queue.countDocuments({
      hospitalName: queue.hospitalName,
      specialty: queue.specialty,
      status: "waiting",
      position: { $lt: queue.position },
    });

    // Update estimated wait time
    const updatedWaitTime = aheadInQueue * 15;
    queue.estimatedWaitTime = updatedWaitTime;
    await queue.save();

    res.json({
      success: true,
      data: {
        ...queue.toObject(),
        queueStats: {
          totalInQueue,
          aheadInQueue,
          estimatedWaitTime: updatedWaitTime,
        },
      },
    });
  } catch (error) {
    console.error("Get queue status error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Leave queue
export const leaveQueue = async (req, res) => {
  try {
    const userId = req.user.id;

    const queue = await Queue.findOne({
      patient: userId,
      status: { $in: ["waiting", "called"] },
    });

    if (!queue) {
      return res.status(404).json({
        success: false,
        message: "You are not currently in any queue",
      });
    }

    // Update queue status
    queue.status = "cancelled";
    await queue.save();

    // Update positions of remaining patients
    await Queue.updateMany(
      {
        hospitalName: queue.hospitalName,
        specialty: queue.specialty,
        status: "waiting",
        position: { $gt: queue.position },
      },
      { $inc: { position: -1 } }
    );

    // Create notification
    await Notification.create({
      user: userId,
      title: "Left Queue",
      message: `You have left the ${queue.specialty} queue at ${queue.hospitalName}.`,
      type: "queue_update",
      relatedEntity: {
        type: "queue",
        id: queue._id,
      },
    });

    res.json({
      success: true,
      message: "Successfully left the queue",
      data: queue,
    });
  } catch (error) {
    console.error("Leave queue error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get queue history
export const getQueueHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const queues = await Queue.find({ patient: userId })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Queue.countDocuments({ patient: userId });

    res.json({
      success: true,
      data: {
        queues,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
        },
      },
    });
  } catch (error) {
    console.error("Get queue history error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get hospital queues (for staff)
export const getHospitalQueues = async (req, res) => {
  try {
    const { specialty } = req.query;
    // Derive staff hospital strictly from the authenticated user profile
    let staffHospital = null;
    try {
      const { User } = await import("../models/User.js");
      const staffUser = await User.findById(req.user.id).lean();
      if (staffUser && staffUser.hospitalName) {
        staffHospital = staffUser.hospitalName;
      }
    } catch (_) {}

    if (!staffHospital) {
      return res.status(400).json({
        success: false,
        message: "Hospital name is required",
      });
    }

    const query = {
      hospitalName: staffHospital,
      status: { $in: ["waiting", "called"] },
    };
    if (specialty) {
      query.specialty = specialty;
    }

    const queues = await Queue.find(query)
      .populate("patient", "firstName lastName email phone")
      .populate("assignedRoom", "name floor")
      .sort({ position: 1 })
      .lean();

    res.json({
      success: true,
      data: queues,
    });
  } catch (error) {
    console.error("Get hospital queues error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get all queue data for public viewing (patients can see all queues)
export const getAllQueues = async (req, res) => {
  try {
    const userId = req.user.id;
    const { specialty } = req.query;

    // Patients can only view queues for the hospital they have joined
    const activeQueue = await Queue.findOne({
      patient: userId,
      status: { $in: ["waiting", "called"] },
    })
      .select("hospitalName specialty")
      .lean();

    if (!activeQueue) {
      return res.status(403).json({
        success: false,
        message: "Join a queue to view the hospital queue list",
      });
    }

    const query = {
      hospitalName: activeQueue.hospitalName,
      status: { $in: ["waiting", "called"] },
    };
    if (specialty) query.specialty = specialty;

    const queues = await Queue.find(query)
      .populate("patient", "firstName lastName")
      .populate("assignedRoom", "name floor")
      .sort({ position: 1 })
      .lean();

    const formattedQueues = queues.map((queue) => ({
      id: queue._id,
      queueNumber: queue.queueNumber,
      position: queue.position,
      specialty: queue.specialty,
      hospitalName: queue.hospitalName,
      status: queue.status,
      estimatedWaitTime: queue.estimatedWaitTime,
      joinedAt: queue.createdAt,
      patientName: queue.patient
        ? `${queue.patient.firstName} ${queue.patient.lastName}`
        : "Unknown",
      assignedRoom: queue.assignedRoom
        ? {
            name: queue.assignedRoom.name,
            floor: queue.assignedRoom.floor,
          }
        : null,
    }));

    res.json({
      success: true,
      data: formattedQueues,
    });
  } catch (error) {
    console.error("Get all queues error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Debug endpoint to see all queues in database
export const debugAllQueues = async (req, res) => {
  try {
    // Get all queues without any filters
    const allQueues = await Queue.find({})
      .populate("patient", "firstName lastName email")
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      total: allQueues.length,
      data: allQueues,
    });
  } catch (error) {
    console.error("Debug all queues error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Call next patient in queue (for staff)
export const callNextPatient = async (req, res) => {
  try {
    const { hospitalName, specialty } = req.body;

    // Find the next patient in queue (waiting status, lowest position number = first in line)
    const nextPatient = await Queue.findOne({
      status: "waiting",
      ...(hospitalName && { hospitalName }),
      ...(specialty && { specialty }),
    })
      .populate("patient", "firstName lastName email")
      .sort({ position: 1 }) // First come, first served (lowest position number first)
      .lean();

    if (!nextPatient) {
      return res.status(404).json({
        success: false,
        message: "No patients waiting in queue",
      });
    }

    // Update the patient's status to "called"
    await Queue.findByIdAndUpdate(nextPatient._id, {
      status: "called",
      calledAt: new Date(),
    });

    // Create notification for the patient
    try {
      const { Notification } = await import("../models/Notification.js");
      await Notification.create({
        user: nextPatient.patient._id,
        type: "queue_update",
        title: "You've been called!",
        message: `Please proceed to ${nextPatient.specialty} department. Your queue number is ${nextPatient.queueNumber}.`,
        priority: "high",
        data: {
          queueId: nextPatient._id,
          queueNumber: nextPatient.queueNumber,
          specialty: nextPatient.specialty,
          hospitalName: nextPatient.hospitalName,
        },
      });
    } catch (notificationError) {
      console.error("Failed to create notification:", notificationError);
      // Don't fail the call next operation if notification fails
    }

    // Broadcast queue update to hospital staff
    webSocketService.broadcastQueueUpdate(nextPatient.hospitalName, {
      type: "patient_called",
      queue: nextPatient,
      timestamp: new Date(),
    });

    // Send notification to specific patient
    webSocketService.sendNotificationToUser(
      nextPatient.patient._id.toString(),
      {
        type: "queue_update",
        title: "You've been called!",
        message: `Please proceed to ${nextPatient.specialty} department. Your queue number is ${nextPatient.queueNumber}.`,
        priority: "high",
      }
    );

    res.json({
      success: true,
      message: "Patient called successfully",
      data: {
        patientName: `${nextPatient.patient.firstName} ${nextPatient.patient.lastName}`,
        queueNumber: nextPatient.queueNumber,
        specialty: nextPatient.specialty,
        hospitalName: nextPatient.hospitalName,
        calledAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Call next patient error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Call specific patient by queue ID
export const callSpecificPatient = async (req, res) => {
  try {
    const { queueId } = req.body;

    if (!queueId) {
      return res.status(400).json({
        success: false,
        message: "Queue ID is required",
      });
    }

    // Find the specific patient in queue
    const patient = await Queue.findById(queueId)
      .populate("patient", "firstName lastName email")
      .lean();

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found in queue",
      });
    }

    if (patient.status !== "waiting") {
      return res.status(400).json({
        success: false,
        message: `Patient is already ${patient.status}`,
      });
    }

    // Update the patient's status to "called"
    await Queue.findByIdAndUpdate(queueId, {
      status: "called",
      calledAt: new Date(),
    });

    // Create notification for the patient
    try {
      const { Notification } = await import("../models/Notification.js");
      await Notification.create({
        user: patient.patient._id,
        type: "queue_update",
        title: "You've been called!",
        message: `Please proceed to ${patient.specialty} department. Your queue number is ${patient.queueNumber}.`,
        priority: "high",
        data: {
          queueId: patient._id,
          queueNumber: patient.queueNumber,
          specialty: patient.specialty,
        },
      });
    } catch (notificationError) {
      console.error("Notification creation error:", notificationError);
    }

    res.json({
      success: true,
      message: "Patient called successfully",
      data: {
        patientName: `${patient.patient.firstName} ${patient.patient.lastName}`,
        queueNumber: patient.queueNumber,
        specialty: patient.specialty,
      },
    });
  } catch (error) {
    console.error("Call specific patient error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Complete specific patient by queue ID
export const completeSpecificPatient = async (req, res) => {
  try {
    const { queueId } = req.body;

    if (!queueId) {
      return res.status(400).json({
        success: false,
        message: "Queue ID is required",
      });
    }

    // Find the specific patient in queue
    const patient = await Queue.findById(queueId)
      .populate("patient", "firstName lastName email")
      .lean();

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found in queue",
      });
    }

    if (patient.status !== "called") {
      return res.status(400).json({
        success: false,
        message: `Patient must be called first. Current status: ${patient.status}`,
      });
    }

    // Update the patient's status to "served"
    await Queue.findByIdAndUpdate(queueId, {
      status: "served",
      servedAt: new Date(),
    });

    // Create notification for the patient
    try {
      const { Notification } = await import("../models/Notification.js");
      await Notification.create({
        user: patient.patient._id,
        type: "queue_update",
        title: "Service Completed",
        message: `Your visit to ${patient.specialty} department has been completed. Thank you for choosing our services.`,
        priority: "high",
        data: {
          queueId: patient._id,
          queueNumber: patient.queueNumber,
          specialty: patient.specialty,
        },
      });
    } catch (notificationError) {
      console.error("Notification creation error:", notificationError);
    }

    res.json({
      success: true,
      message: "Patient completed successfully",
      data: {
        patientName: `${patient.patient.firstName} ${patient.patient.lastName}`,
        queueNumber: patient.queueNumber,
        specialty: patient.specialty,
      },
    });
  } catch (error) {
    console.error("Complete specific patient error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Mark a called patient's visit as completed (for staff)
export const completeCurrentPatient = async (req, res) => {
  try {
    const { queueId } = req.body;

    // Find the queue item that is currently called
    const queueItem = await Queue.findOne(
      queueId
        ? { _id: queueId }
        : {
            status: "called",
          }
    ).populate("patient", "firstName lastName email");

    if (!queueItem) {
      return res.status(404).json({
        success: false,
        message: "No called patient found to complete",
      });
    }

    // Mark as served/completed
    queueItem.status = "served";
    queueItem.servedAt = new Date();
    await queueItem.save();

    // Create notification for the patient
    try {
      await Notification.create({
        user: queueItem.patient._id,
        type: "queue_update",
        title: "Visit Completed",
        message: `Your visit for ${queueItem.specialty} at ${queueItem.hospitalName} has been marked completed.`,
        priority: "high",
        data: {
          queueId: queueItem._id,
          queueNumber: queueItem.queueNumber,
          status: queueItem.status,
        },
      });
    } catch (notificationError) {
      console.error("Failed to create notification:", notificationError);
    }

    return res.json({
      success: true,
      message: "Patient visit marked as completed",
      data: {
        id: queueItem._id,
        queueNumber: queueItem.queueNumber,
        patientName: `${queueItem.patient.firstName} ${queueItem.patient.lastName}`,
        status: queueItem.status,
      },
    });
  } catch (error) {
    console.error("Complete patient error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// Notify selected patients
export const notifySelectedPatients = async (req, res) => {
  try {
    const { patientIds, message, hospitalName, priority = "medium" } = req.body;

    if (!patientIds || !Array.isArray(patientIds) || patientIds.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Patient IDs are required" });
    }

    if (!message || !message.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Notification message is required" });
    }

    // Find patients by IDs
    const patients = await User.find({ _id: { $in: patientIds } });

    if (patients.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No patients found" });
    }

    // Create notifications for each patient
    const notifications = patients.map((patient) => ({
      user: patient._id,
      type: "general",
      title: "Hospital Notification",
      message: message.trim(),
      priority: priority,
      isRead: false,
    }));

    await Notification.insertMany(notifications);

    return res.json({
      success: true,
      message: `Notifications sent to ${patients.length} patients`,
      data: {
        notifiedCount: patients.length,
        patientNames: patients.map((p) => `${p.firstName} ${p.lastName}`),
      },
    });
  } catch (error) {
    console.error("Notify patients error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// Assign room to selected patients
export const assignRoomToPatients = async (req, res) => {
  try {
    const { queueIds, roomId } = req.body;

    if (!queueIds || !Array.isArray(queueIds) || queueIds.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Queue IDs are required" });
    }

    if (!roomId || !roomId.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Room ID is required" });
    }

    // Import WaitingRoom model
    const { WaitingRoom } = await import("../models/WaitingRoom.js");

    // Verify the room exists and get room details
    const waitingRoom = await WaitingRoom.findById(roomId);
    if (!waitingRoom) {
      return res
        .status(404)
        .json({ success: false, message: "Waiting room not found" });
    }

    // Update queue items with assigned room
    const updateResult = await Queue.updateMany(
      { _id: { $in: queueIds } },
      { assignedRoom: roomId }
    );

    if (updateResult.modifiedCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No queue items found or updated" });
    }

    // Get updated queue items with patient info
    const updatedQueues = await Queue.find({ _id: { $in: queueIds } }).populate(
      "patient",
      "firstName lastName"
    );

    // Create notifications for assigned patients
    const notifications = updatedQueues.map((queue) => ({
      user: queue.patient._id,
      type: "queue_update",
      title: "Room Assignment",
      message: `You have been assigned to ${
        waitingRoom.name
      }. Please proceed to ${waitingRoom.name} on ${
        waitingRoom.floor || "the designated floor"
      }.`,
      priority: "high",
      isRead: false,
      relatedEntity: {
        type: "queue",
        id: queue._id,
      },
    }));

    await Notification.insertMany(notifications);

    // Update waiting room occupancy
    const newOccupancy =
      waitingRoom.currentOccupancy + updateResult.modifiedCount;
    await waitingRoom.updateOccupancy(newOccupancy);

    // Send notifications to assigned patients via WebSocket
    updatedQueues.forEach((queue) => {
      webSocketService.sendNotificationToUser(queue.patient._id.toString(), {
        type: "room_assignment",
        title: "Room Assignment",
        message: `You have been assigned to ${
          waitingRoom.name
        }. Please proceed to ${waitingRoom.name} on ${
          waitingRoom.floor || "the designated floor"
        }.`,
        priority: "high",
        roomData: {
          roomId: waitingRoom._id,
          roomName: waitingRoom.name,
          floor: waitingRoom.floor,
        },
      });
    });

    // Broadcast waiting room update to hospital staff
    webSocketService.broadcastWaitingRoomUpdate(
      waitingRoom.hospitalName,
      roomId,
      {
        type: "patients_assigned",
        patientCount: updateResult.modifiedCount,
        newOccupancy: newOccupancy,
        occupancyPercentage: waitingRoom.occupancyPercentage,
        assignedPatients: updatedQueues.map((q) => ({
          id: q._id,
          patientName: `${q.patient.firstName} ${q.patient.lastName}`,
          queueNumber: q.queueNumber,
        })),
        timestamp: new Date(),
      }
    );

    return res.json({
      success: true,
      message: `Assigned ${updateResult.modifiedCount} patients to ${waitingRoom.name}`,
      data: {
        modifiedCount: updateResult.modifiedCount,
        roomName: waitingRoom.name,
        roomFloor: waitingRoom.floor,
        newOccupancy: newOccupancy,
        roomCapacity: waitingRoom.capacity,
        patientNames: updatedQueues.map(
          (q) => `${q.patient.firstName} ${q.patient.lastName}`
        ),
      },
    });
  } catch (error) {
    console.error("Assign room to patients error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// Mark selected patients as no-show
export const markPatientsNoShow = async (req, res) => {
  try {
    const { queueIds } = req.body;

    if (!queueIds || !Array.isArray(queueIds) || queueIds.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Queue IDs are required" });
    }

    // Update queue items to no-show status
    const updateResult = await Queue.updateMany(
      { _id: { $in: queueIds } },
      { status: "no_show" }
    );

    if (updateResult.modifiedCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No queue items found or updated" });
    }

    // Get updated queue items with patient info
    const updatedQueues = await Queue.find({ _id: { $in: queueIds } }).populate(
      "patient",
      "firstName lastName"
    );

    // Create notifications for no-show patients
    const notifications = updatedQueues.map((queue) => ({
      user: queue.patient._id,
      type: "queue_update",
      title: "No-Show Marked",
      message: `You have been marked as no-show. Please contact the hospital if you need to reschedule your appointment.`,
      priority: "high",
      isRead: false,
    }));

    await Notification.insertMany(notifications);

    return res.json({
      success: true,
      message: `Marked ${updateResult.modifiedCount} patients as no-show`,
      data: {
        noShowCount: updateResult.modifiedCount,
        patientNames: updatedQueues.map(
          (q) => `${q.patient.firstName} ${q.patient.lastName}`
        ),
      },
    });
  } catch (error) {
    console.error("Mark no-show error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
