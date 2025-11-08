import mongoose from "mongoose";

const waitingRoomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    hospitalName: {
      type: String,
      required: true,
      trim: true,
    },
    floor: {
      type: String,
      trim: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    currentOccupancy: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["available", "full", "maintenance", "closed"],
      default: "available",
    },
    color: {
      type: String,
      enum: ["green", "yellow", "orange", "red"],
      default: "green",
    },
    specialties: [
      {
        type: String,
        trim: true,
      },
    ],
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
waitingRoomSchema.index({ hospitalName: 1, isActive: 1 });
waitingRoomSchema.index({ name: 1, hospitalName: 1 }, { unique: true });

// Virtual for occupancy percentage
waitingRoomSchema.virtual("occupancyPercentage").get(function () {
  return Math.round((this.currentOccupancy / this.capacity) * 100);
});

// Method to update occupancy
waitingRoomSchema.methods.updateOccupancy = function (newOccupancy) {
  this.currentOccupancy = Math.max(0, Math.min(newOccupancy, this.capacity));
  this.lastUpdated = new Date();

  // Update color and status based on occupancy
  const percentage = this.occupancyPercentage;
  if (percentage >= 100) {
    this.color = "red";
    this.status = "full";
  } else if (percentage >= 80) {
    this.color = "orange";
    this.status = "busy";
  } else if (percentage >= 60) {
    this.color = "yellow";
    this.status = "moderate";
  } else if (percentage > 0) {
    this.color = "green";
    this.status = "available";
  } else {
    this.color = "green";
    this.status = "empty";
  }

  return this.save();
};

// Method to add patient to waiting room
waitingRoomSchema.methods.addPatient = function () {
  if (this.currentOccupancy < this.capacity) {
    this.currentOccupancy += 1;
    this.lastUpdated = new Date();
    return this.save();
  }
  throw new Error("Waiting room is at full capacity");
};

// Method to remove patient from waiting room
waitingRoomSchema.methods.removePatient = function () {
  if (this.currentOccupancy > 0) {
    this.currentOccupancy -= 1;
    this.lastUpdated = new Date();
    return this.save();
  }
  throw new Error("No patients to remove from waiting room");
};

export const WaitingRoom = mongoose.model("WaitingRoom", waitingRoomSchema);
