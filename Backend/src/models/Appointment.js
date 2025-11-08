import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    doctor: {
      type: String,
      required: true,
      trim: true,
    },
    specialty: {
      type: String,
      required: true,
      trim: true,
    },
    appointmentDate: {
      type: Date,
      required: true,
    },
    appointmentTime: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: [
        "scheduled",
        "confirmed",
        "checked-in",
        "in-progress",
        "in-queue",
        "completed",
        "cancelled",
        "rescheduled",
        "no-show",
      ],
      default: "scheduled",
    },
    notes: {
      type: String,
      trim: true,
    },
    hospitalName: {
      type: String,
      trim: true,
    },
    // Patient information for the appointment
    patientInfo: {
      fullName: {
        type: String,
        required: true,
        trim: true,
      },
      phoneNumber: {
        type: String,
        required: true,
        trim: true,
      },
      gender: {
        type: String,
        enum: ["male", "female", "other", "prefer-not-to-say"],
        required: true,
      },
      dateOfBirth: {
        type: Date,
        required: false,
      },
    },
    isRescheduled: {
      type: Boolean,
      default: false,
    },
    originalAppointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
    },
    reminderSent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
appointmentSchema.index({ patient: 1, appointmentDate: 1 });
appointmentSchema.index({ status: 1, appointmentDate: 1 });

export const Appointment = mongoose.model("Appointment", appointmentSchema);
