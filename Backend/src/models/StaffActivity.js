import mongoose from "mongoose";

const staffActivitySchema = new mongoose.Schema(
  {
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    hospitalName: {
      type: String,
      required: true,
      trim: true,
    },
    activity: {
      type: String,
      enum: ["login", "logout", "active", "inactive"],
      required: true,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
staffActivitySchema.index({ staff: 1, hospitalName: 1 });
staffActivitySchema.index({ hospitalName: 1, isActive: 1 });
staffActivitySchema.index({ lastActivityAt: -1 });

// Method to mark staff as active
staffActivitySchema.methods.markAsActive = function () {
  this.isActive = true;
  this.lastActivityAt = new Date();
  this.activity = "active";
  return this.save();
};

// Method to mark staff as inactive
staffActivitySchema.methods.markAsInactive = function () {
  this.isActive = false;
  this.lastActivityAt = new Date();
  this.activity = "inactive";
  return this.save();
};

export const StaffActivity = mongoose.model(
  "StaffActivity",
  staffActivitySchema
);
