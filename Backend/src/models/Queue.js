import mongoose from "mongoose";

const queueSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    hospitalName: {
      type: String,
      required: true,
      trim: true,
    },
    specialty: {
      type: String,
      required: true,
      trim: true,
    },
    queueNumber: {
      type: String,
      required: true,
      trim: true,
    },
    position: {
      type: Number,
      required: true,
    },
    estimatedWaitTime: {
      type: Number, // in minutes
      default: 0,
    },
    status: {
      type: String,
      enum: ["waiting", "called", "served", "cancelled", "no_show"],
      default: "waiting",
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    calledAt: {
      type: Date,
    },
    servedAt: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    assignedRoom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WaitingRoom",
    },
  },
  { timestamps: true }
);

// Index for efficient queries
queueSchema.index({ hospitalName: 1, specialty: 1, status: 1 });
queueSchema.index({ patient: 1, status: 1 });
queueSchema.index({ position: 1, status: 1 });

export const Queue = mongoose.model("Queue", queueSchema);
