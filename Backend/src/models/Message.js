import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    messageType: {
      type: String,
      enum: ["general", "appointment_reminder", "status_update", "urgent"],
      default: "general",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
    // Hospital context
    hospitalName: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Indexes for better query performance
messageSchema.index({ receiverId: 1, createdAt: -1 });
messageSchema.index({ appointmentId: 1 });
messageSchema.index({ hospitalName: 1 });

export const Message = mongoose.model("Message", messageSchema);
