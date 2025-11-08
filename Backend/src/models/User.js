import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["patient", "staff"], required: true },
    hospitalName: { type: String, trim: true }, // only for staff
    // Patient-specific fields
    preferredHospital: { type: String, trim: true },
    gender: {
      type: String,
      enum: ["male", "female", "other", "prefer-not-to-say"],
      trim: true,
    },
    dateOfBirth: { type: Date },
    resetPasswordToken: { type: String },
    resetPasswordExpiry: { type: Date },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
