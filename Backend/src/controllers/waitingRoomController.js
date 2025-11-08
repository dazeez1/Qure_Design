import { WaitingRoom } from "../models/WaitingRoom.js";
import { Queue } from "../models/Queue.js";
import { User } from "../models/User.js";
import { webSocketService } from "../services/websocket.js";

// Get all waiting rooms for a hospital
export const getWaitingRooms = async (req, res) => {
  try {
    let { hospitalName } = req.user; // Get from authenticated user

    // If hospitalName is not in token, get it from user database record
    if (!hospitalName) {
      const userId = req.user.id;
      const user = await User.findById(userId);
      if (user) {
        hospitalName = user.hospitalName;
      }
    }

    if (!hospitalName) {
      console.error("Hospital information not found for user:", req.user.id);
      return res.status(400).json({
        success: false,
        message: "Hospital information not found. Please log in again.",
      });
    }

    const waitingRooms = await WaitingRoom.find({
      hospitalName,
      isActive: true,
    }).sort({ name: 1 });

    // Get current patient counts for each waiting room
    const waitingRoomsWithPatients = await Promise.all(
      waitingRooms.map(async (room) => {
        // Count patients assigned to this specific room OR in this room's specialties
        const patientCount = await Queue.countDocuments({
          hospitalName,
          status: { $in: ["waiting", "called"] },
          $or: [
            { assignedRoom: room._id }, // Patients assigned to this specific room
            {
              specialty: { $in: room.specialties },
              assignedRoom: { $exists: false }, // Patients in room's specialties but not assigned to any room
            },
          ],
        });

        // Update occupancy if different
        if (patientCount !== room.currentOccupancy) {
          try {
            await room.updateOccupancy(patientCount);
          } catch (updateError) {
            console.error("Error updating room occupancy:", updateError);
            // Continue with the original room data if update fails
          }
        }

        return {
          ...room.toObject(),
          occupancyPercentage: room.occupancyPercentage,
          patientCount,
        };
      })
    );

    res.json({
      success: true,
      data: waitingRoomsWithPatients,
    });
  } catch (error) {
    console.error("Get waiting rooms error:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Failed to fetch waiting rooms",
    });
  }
};

// Get waiting room details with patient list
export const getWaitingRoomDetails = async (req, res) => {
  try {
    const { roomId } = req.params;
    let { hospitalName } = req.user;

    // If hospitalName is not in token, get it from user database record
    if (!hospitalName) {
      const user = await User.findById(req.user.id);
      hospitalName = user?.hospitalName;
    }

    if (!hospitalName) {
      return res.status(400).json({
        success: false,
        message: "Hospital information not found. Please log in again.",
      });
    }

    const waitingRoom = await WaitingRoom.findOne({
      _id: roomId,
      hospitalName,
      isActive: true,
    });

    if (!waitingRoom) {
      return res.status(404).json({
        success: false,
        message: "Waiting room not found",
      });
    }

    // Get patients assigned to this specific room OR in this room's specialties
    const patients = await Queue.find({
      hospitalName,
      status: { $in: ["waiting", "called"] },
      $or: [
        { assignedRoom: roomId }, // Patients assigned to this specific room
        {
          specialty: { $in: waitingRoom.specialties },
          assignedRoom: { $exists: false }, // Patients in room's specialties but not assigned to any room
        },
      ],
    })
      .populate("patient", "firstName lastName email phone")
      .populate("assignedRoom", "name floor")
      .sort({ position: 1 })
      .lean();

    const patientList = patients.map((queue) => ({
      id: queue._id,
      name:
        queue.patientName ||
        `${queue.patient.firstName} ${queue.patient.lastName}`,
      queueNumber: queue.queueNumber,
      specialty: queue.specialty,
      status: queue.status,
      waitTime: queue.estimatedWaitTime || 0,
      joinedAt: queue.joinedAt,
    }));

    res.json({
      success: true,
      data: {
        ...waitingRoom.toObject(),
        occupancyPercentage: waitingRoom.occupancyPercentage,
        patients: patientList,
      },
    });
  } catch (error) {
    console.error("Get waiting room details error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Create new waiting room
export const createWaitingRoom = async (req, res) => {
  try {
    let { hospitalName } = req.user;

    // If hospitalName is not in token, get it from user database record
    if (!hospitalName) {
      const { User } = await import("../models/User.js");
      const user = await User.findById(req.user.id);
      hospitalName = user?.hospitalName;
    }

    if (!hospitalName) {
      return res.status(400).json({
        success: false,
        message: "Hospital information not found. Please log in again.",
      });
    }

    const { name, description, floor, capacity, specialties = [] } = req.body;

    // Check if waiting room with same name exists
    const existingRoom = await WaitingRoom.findOne({
      name,
      hospitalName,
      isActive: true,
    });

    if (existingRoom) {
      return res.status(400).json({
        success: false,
        message: "Waiting room with this name already exists",
      });
    }

    const waitingRoom = new WaitingRoom({
      name,
      description,
      hospitalName,
      floor,
      capacity,
      specialties,
      currentOccupancy: 0,
    });

    await waitingRoom.save();

    res.status(201).json({
      success: true,
      message: "Waiting room created successfully",
      data: waitingRoom,
    });
  } catch (error) {
    console.error("Create waiting room error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Update waiting room
export const updateWaitingRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    let { hospitalName } = req.user;

    // If hospitalName is not in token, get it from user database record
    if (!hospitalName) {
      const user = await User.findById(req.user.id);
      hospitalName = user?.hospitalName;
    }

    if (!hospitalName) {
      return res.status(400).json({
        success: false,
        message: "Hospital information not found. Please log in again.",
      });
    }

    const updateData = req.body;

    const waitingRoom = await WaitingRoom.findOneAndUpdate(
      {
        _id: roomId,
        hospitalName,
        isActive: true,
      },
      { ...updateData, lastUpdated: new Date() },
      { new: true, runValidators: true }
    );

    if (!waitingRoom) {
      return res.status(404).json({
        success: false,
        message: "Waiting room not found",
      });
    }

    res.json({
      success: true,
      message: "Waiting room updated successfully",
      data: waitingRoom,
    });
  } catch (error) {
    console.error("Update waiting room error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Delete waiting room (soft delete)
export const deleteWaitingRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    let { hospitalName } = req.user;

    // If hospitalName is not in token, get it from user database record
    if (!hospitalName) {
      const user = await User.findById(req.user.id);
      hospitalName = user?.hospitalName;
    }

    if (!hospitalName) {
      return res.status(400).json({
        success: false,
        message: "Hospital information not found. Please log in again.",
      });
    }

    const waitingRoom = await WaitingRoom.findOneAndUpdate(
      {
        _id: roomId,
        hospitalName,
        isActive: true,
      },
      { isActive: false },
      { new: true }
    );

    if (!waitingRoom) {
      return res.status(404).json({
        success: false,
        message: "Waiting room not found",
      });
    }

    res.json({
      success: true,
      message: "Waiting room deleted successfully",
    });
  } catch (error) {
    console.error("Delete waiting room error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Send notification to patients in waiting room
export const notifyWaitingRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    let { hospitalName } = req.user;

    // If hospitalName is not in token, get it from user database record
    if (!hospitalName) {
      const user = await User.findById(req.user.id);
      hospitalName = user?.hospitalName;
    }

    if (!hospitalName) {
      return res.status(400).json({
        success: false,
        message: "Hospital information not found. Please log in again.",
      });
    }

    const { message, type = "email" } = req.body;

    const waitingRoom = await WaitingRoom.findOne({
      _id: roomId,
      hospitalName,
      isActive: true,
    });

    if (!waitingRoom) {
      return res.status(404).json({
        success: false,
        message: "Waiting room not found",
      });
    }

    // Get patients in this waiting room
    const patients = await Queue.find({
      hospitalName,
      status: { $in: ["waiting", "called"] },
      specialty: { $in: waitingRoom.specialties },
    }).populate("patient");

    if (patients.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No patients in this waiting room",
      });
    }

    // Create notifications for each patient
    const { Notification } = await import("../models/Notification.js");

    const notifications = await Promise.all(
      patients.map((queue) => {
        return Notification.create({
          user: queue.patient._id,
          type: "general",
          title: `Announcement from ${waitingRoom.name}`,
          message,
          priority: "medium",
          relatedEntity: {
            type: "queue",
            id: queue._id,
          },
        });
      })
    );

    res.json({
      success: true,
      message: `Notification sent to ${patients.length} patients`,
      data: {
        patientsNotified: patients.length,
        waitingRoom: waitingRoom.name,
        type,
      },
    });
  } catch (error) {
    console.error("Notify waiting room error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Update waiting room occupancy manually
export const updateOccupancy = async (req, res) => {
  try {
    const { roomId } = req.params;
    let { hospitalName } = req.user;

    // If hospitalName is not in token, get it from user database record
    if (!hospitalName) {
      const user = await User.findById(req.user.id);
      hospitalName = user?.hospitalName;
    }

    if (!hospitalName) {
      return res.status(400).json({
        success: false,
        message: "Hospital information not found. Please log in again.",
      });
    }

    const { occupancy } = req.body;

    const waitingRoom = await WaitingRoom.findOne({
      _id: roomId,
      hospitalName,
      isActive: true,
    });

    if (!waitingRoom) {
      return res.status(404).json({
        success: false,
        message: "Waiting room not found",
      });
    }

    await waitingRoom.updateOccupancy(occupancy);

    // Broadcast waiting room update via WebSocket
    webSocketService.broadcastWaitingRoomUpdate(hospitalName, roomId, {
      type: "occupancy_updated",
      currentOccupancy: waitingRoom.currentOccupancy,
      capacity: waitingRoom.capacity,
      occupancyPercentage: waitingRoom.occupancyPercentage,
      status: waitingRoom.status,
      color: waitingRoom.color,
      timestamp: new Date(),
    });

    res.json({
      success: true,
      message: "Occupancy updated successfully",
      data: {
        ...waitingRoom.toObject(),
        occupancyPercentage: waitingRoom.occupancyPercentage,
      },
    });
  } catch (error) {
    console.error("Update occupancy error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
