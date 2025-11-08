import mongoose from "mongoose";

const accessCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    hospitalName: {
      type: String,
      required: true,
      trim: true,
    },
    permissions: [
      {
        type: String,
        enum: [
          "queue_management",
          "appointments",
          "analytics",
          "staff_management",
        ],
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
      default: null, // null means no expiration
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    lastUsedAt: {
      type: Date,
      default: null,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Index for faster lookups
// Note: 'unique: true' on code already creates a unique index.
// Avoid duplicate index definitions to prevent Mongoose warnings.
accessCodeSchema.index({ isActive: 1 });

// Virtual for checking if code is expired
accessCodeSchema.virtual("isExpired").get(function () {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

// Virtual for checking if code is valid
accessCodeSchema.virtual("isValid").get(function () {
  return this.isActive && !this.isExpired;
});

// Method to increment usage
accessCodeSchema.methods.incrementUsage = function () {
  this.usageCount += 1;
  this.lastUsedAt = new Date();
  return this.save();
};

export const AccessCode = mongoose.model("AccessCode", accessCodeSchema);
