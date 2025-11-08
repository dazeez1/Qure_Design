import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comments: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 500,
    },
    visitType: {
      type: String,
      enum: ["appointment", "queue", "general"],
      default: "general",
    },
    doctorName: {
      type: String,
      trim: true,
    },
    specialty: {
      type: String,
      trim: true,
    },
    hospitalName: {
      type: String,
      trim: true,
    },
    visitDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "resolved"],
      default: "pending",
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
feedbackSchema.index({ patient: 1, createdAt: -1 });
feedbackSchema.index({ rating: 1 });
feedbackSchema.index({ status: 1 });

// Virtual for patient name (if not anonymous)
feedbackSchema.virtual("patientName").get(function () {
  if (this.isAnonymous) {
    return "Anonymous";
  }
  return (
    this.populated("patient")?.firstName +
    " " +
    this.populated("patient")?.lastName
  );
});

// Ensure virtual fields are serialized
feedbackSchema.set("toJSON", { virtuals: true });

const Feedback = mongoose.model("Feedback", feedbackSchema);

export default Feedback;
