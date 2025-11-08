import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    shortCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    hospitalName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    capacity: {
      type: Number,
      default: 50,
      min: 1,
    },
    currentOccupancy: {
      type: Number,
      default: 0,
      min: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
departmentSchema.index({ hospitalName: 1, shortCode: 1 }, { unique: true });
departmentSchema.index({ hospitalName: 1, status: 1 });
departmentSchema.index({ name: 1, hospitalName: 1 });

// Virtual for occupancy percentage
departmentSchema.virtual("occupancyPercentage").get(function () {
  return Math.round((this.currentOccupancy / this.capacity) * 100);
});

// Method to update occupancy
departmentSchema.methods.updateOccupancy = function (newOccupancy) {
  this.currentOccupancy = Math.max(0, Math.min(newOccupancy, this.capacity));
  return this.save();
};

export const Department = mongoose.model("Department", departmentSchema);
