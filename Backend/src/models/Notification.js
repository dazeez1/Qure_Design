import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        "queue_update",
        "appointment_reminder",
        "appointment_confirmed",
        "appointment_cancelled",
        "appointment_checked_in",
        "appointment_updated",
        "appointment_update",
        "appointment_completed",
        "appointment_rescheduled",
        "general",
      ],
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    relatedEntity: {
      type: {
        type: String,
        enum: ["appointment", "queue", "user"],
      },
      id: {
        type: mongoose.Schema.Types.ObjectId,
      },
    },
    scheduledFor: {
      type: Date,
    },
    sentAt: {
      type: Date,
    },
    deliveryMethod: {
      type: [String],
      enum: ["in_app", "email", "sms", "push"],
      default: ["in_app"],
    },
  },
  { timestamps: true }
);

// Index for efficient queries
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ type: 1, scheduledFor: 1 });
notificationSchema.index({ relatedEntity: 1 });

export const Notification = mongoose.model("Notification", notificationSchema);
