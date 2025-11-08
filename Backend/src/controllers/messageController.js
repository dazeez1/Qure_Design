import { Message } from "../models/Message.js";
import { User } from "../models/User.js";
import { Appointment } from "../models/Appointment.js";
import { Notification } from "../models/Notification.js";
import { sendEmail } from "../utils/email.js";

// ===== Send Message to Patient =====
export const sendMessage = async (req, res) => {
  try {
    const {
      appointmentId,
      message,
      messageType = "general",
      priority = "medium",
    } = req.body;
    const senderId = req.user.id;
    const hospitalName = req.user.hospitalName;

    // Validate required fields
    if (!appointmentId || !message) {
      return res.status(400).json({
        success: false,
        message: "Appointment ID and message are required",
      });
    }

    // Find the appointment
    const appointment = await Appointment.findById(appointmentId).populate(
      "patient"
    );
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Verify the appointment belongs to the staff's hospital
    if (appointment.hospitalName !== hospitalName) {
      return res.status(403).json({
        success: false,
        message: "You can only send messages for appointments in your hospital",
      });
    }

    // Get patient ID
    const receiverId = appointment.patient;

    // Create the message
    const newMessage = new Message({
      senderId,
      receiverId,
      appointmentId,
      message,
      messageType,
      priority,
      hospitalName,
    });

    await newMessage.save();

    // Create notification for the patient
    const notification = new Notification({
      user: receiverId,
      title: "New Message from Hospital Staff",
      message:
        message.length > 100 ? message.substring(0, 100) + "..." : message,
      type: "general",
      priority,
      relatedEntity: {
        type: "appointment",
        id: appointmentId,
      },
    });

    await notification.save();

    // Send email notification if priority is high or urgent
    if (priority === "high" || priority === "urgent") {
      try {
        const patient = await User.findById(receiverId);
        if (patient && patient.email) {
          await sendEmail({
            to: patient.email,
            subject: `Urgent Message from ${hospitalName}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Message from ${hospitalName}</h2>
                <p><strong>Priority:</strong> ${priority.toUpperCase()}</p>
                <p><strong>Appointment:</strong> ${
                  appointment.specialty
                } - ${new Date(
              appointment.appointmentDate
            ).toLocaleDateString()}</p>
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0; font-size: 16px; line-height: 1.5;">${message}</p>
                </div>
                <p style="color: #6b7280; font-size: 14px;">
                  Please log in to your patient portal to view the full message and respond if needed.
                </p>
              </div>
            `,
          });
        }
      } catch (emailError) {
        console.error("Failed to send email notification:", emailError);
        // Don't fail the message sending if email fails
      }
    }

    // Populate the response with sender and receiver details
    await newMessage.populate([
      { path: "senderId", select: "firstName lastName email" },
      { path: "receiverId", select: "firstName lastName email" },
    ]);

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: newMessage,
    });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send message",
      error: error.message,
    });
  }
};

// ===== Get Messages for Patient =====
export const getPatientMessages = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.user.id;

    // Find the appointment to verify access
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Verify the user has access to this appointment
    if (
      appointment.patient.toString() !== userId &&
      req.user.role !== "staff"
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Get messages for this appointment
    const messages = await Message.find({ appointmentId })
      .populate("senderId", "firstName lastName email")
      .populate("receiverId", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error("Get patient messages error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get messages",
      error: error.message,
    });
  }
};

// ===== Get All Messages for Hospital Staff =====
export const getHospitalMessages = async (req, res) => {
  try {
    const hospitalName = req.user.hospitalName;
    const { page = 1, limit = 20, appointmentId } = req.query;

    const query = { hospitalName };
    if (appointmentId) {
      query.appointmentId = appointmentId;
    }

    const messages = await Message.find(query)
      .populate("senderId", "firstName lastName email")
      .populate("receiverId", "firstName lastName email")
      .populate("appointmentId", "specialty appointmentDate")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Message.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        messages,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
        },
      },
    });
  } catch (error) {
    console.error("Get hospital messages error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get messages",
      error: error.message,
    });
  }
};

// ===== Mark Message as Read =====
export const markMessageAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Verify the user is the receiver
    if (message.receiverId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    message.isRead = true;
    message.readAt = new Date();
    await message.save();

    res.status(200).json({
      success: true,
      message: "Message marked as read",
    });
  } catch (error) {
    console.error("Mark message as read error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark message as read",
      error: error.message,
    });
  }
};

// ===== Get Unread Message Count =====
export const getUnreadMessageCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const unreadCount = await Message.countDocuments({
      receiverId: userId,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      data: { unreadCount },
    });
  } catch (error) {
    console.error("Get unread message count error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get unread message count",
      error: error.message,
    });
  }
};
