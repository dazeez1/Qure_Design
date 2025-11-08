import mongoose from "mongoose";

const hospitalSettingsSchema = new mongoose.Schema(
  {
    hospitalName: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
      default: "Nigeria",
    },
    postalCode: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    logo: {
      type: String, // URL or file path to logo
      default: null,
    },
    description: {
      type: String,
      trim: true,
    },
    specialties: [
      {
        type: String,
        trim: true,
      },
    ],
    operatingHours: {
      monday: { open: String, close: String },
      tuesday: { open: String, close: String },
      wednesday: { open: String, close: String },
      thursday: { open: String, close: String },
      friday: { open: String, close: String },
      saturday: { open: String, close: String },
      sunday: { open: String, close: String },
    },
    emergencyContact: {
      phone: String,
      available: Boolean,
    },
    timezone: {
      type: String,
      default: "(GMT+1:00) West Africa Time",
      trim: true,
    },
    capacityThresholds: {
      low: {
        type: Number,
        default: 25,
        min: 0,
        max: 1000,
      },
      medium: {
        type: Number,
        default: 50,
        min: 0,
        max: 1000,
      },
      high: {
        type: Number,
        default: 100,
        min: 0,
        max: 1000,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
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
hospitalSettingsSchema.index({ hospitalName: 1 }, { unique: true });
hospitalSettingsSchema.index({ createdBy: 1 });

export const HospitalSettings = mongoose.model(
  "HospitalSettings",
  hospitalSettingsSchema
);
