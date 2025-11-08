import { Notification } from "../models/Notification.js";
import { z } from "zod";

// Validation schemas
const createNotificationSchema = z.object({
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
  type: z.enum([
    "queue_update",
    "appointment_reminder",
    "appointment_confirmed",
    "appointment_cancelled",
    "general",
  ]),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  scheduledFor: z.string().optional(),
  deliveryMethod: z
    .array(z.enum(["in_app", "email", "sms", "push"]))
    .default(["in_app"]),
});

// Get user notifications
export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const query = { user: userId };
    if (unreadOnly === "true") {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      user: userId,
      isRead: false,
    });

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
        },
      },
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Mark notification as read
export const markNotificationAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const notification = await Notification.findOne({
      _id: id,
      user: userId,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    notification.isRead = true;
    await notification.save();

    res.json({
      success: true,
      message: "Notification marked as read",
      data: notification,
    });
  } catch (error) {
    console.error("Mark notification as read error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.updateMany(
      { user: userId, isRead: false },
      { isRead: true }
    );

    res.json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Mark all notifications as read error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      user: userId,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Create notification (for internal use)
export const createNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const data = createNotificationSchema.parse(req.body);

    const notification = new Notification({
      ...data,
      user: userId,
      scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : undefined,
    });

    await notification.save();

    res.status(201).json({
      success: true,
      message: "Notification created successfully",
      data: notification,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    }

    console.error("Create notification error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get notification preferences
export const getNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's notification preferences from User model
    const user = await import("../models/User.js").then((module) =>
      module.User.findById(userId)
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Default preferences if not set
    const preferences = {
      email: true,
      sms: true,
      push: true,
      inApp: true,
      queueUpdates: true,
      appointmentReminders: true,
      generalNotifications: true,
    };

    res.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    console.error("Get notification preferences error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Update notification preferences
export const updateNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const preferences = req.body;

    // Update user's notification preferences
    const user = await import("../models/User.js").then((module) =>
      module.User.findById(userId)
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // In a real application, you would save these preferences to the user model
    // For now, we'll just return success
    res.json({
      success: true,
      message: "Notification preferences updated successfully",
      data: preferences,
    });
  } catch (error) {
    console.error("Update notification preferences error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
