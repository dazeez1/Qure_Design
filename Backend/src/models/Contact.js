import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      minlength: [10, "Message must be at least 10 characters long"],
      maxlength: [1000, "Message cannot exceed 1000 characters"],
    },
    subject: {
      type: String,
      trim: true,
      maxlength: [200, "Subject cannot exceed 200 characters"],
      default: "General Inquiry",
    },
    category: {
      type: String,
      enum: [
        "general",
        "support",
        "feedback",
        "complaint",
        "partnership",
        "other",
      ],
      default: "general",
    },
    status: {
      type: String,
      enum: ["new", "in_progress", "resolved", "closed"],
      default: "new",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    response: {
      type: String,
      trim: true,
      maxlength: [2000, "Response cannot exceed 2000 characters"],
    },
    respondedAt: {
      type: Date,
      default: null,
    },
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
    readBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    tags: [
      {
        type: String,
        trim: true,
        maxlength: [50, "Tag cannot exceed 50 characters"],
      },
    ],
    source: {
      type: String,
      enum: [
        "website",
        "mobile_app",
        "email",
        "phone",
        "social_media",
        "other",
      ],
      default: "website",
    },
    userAgent: {
      type: String,
      trim: true,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    attachments: [
      {
        filename: String,
        originalName: String,
        mimeType: String,
        size: Number,
        url: String,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
contactSchema.index({ email: 1, createdAt: -1 });
contactSchema.index({ status: 1, priority: 1 });
contactSchema.index({ category: 1, createdAt: -1 });
contactSchema.index({ isRead: 1, createdAt: -1 });

// Virtual for formatted creation date
contactSchema.virtual("formattedDate").get(function () {
  return this.createdAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
});

// Virtual for time since creation
contactSchema.virtual("timeAgo").get(function () {
  const now = new Date();
  const diffInSeconds = Math.floor((now - this.createdAt) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000)
    return `${Math.floor(diffInSeconds / 86400)} days ago`;

  return this.formattedDate;
});

// Pre-save middleware to auto-categorize messages
contactSchema.pre("save", function (next) {
  if (this.isNew) {
    const message = this.message.toLowerCase();

    // Auto-categorize based on message content
    if (
      message.includes("complaint") ||
      message.includes("problem") ||
      message.includes("issue")
    ) {
      this.category = "complaint";
      this.priority = "high";
    } else if (
      message.includes("support") ||
      message.includes("help") ||
      message.includes("assistance")
    ) {
      this.category = "support";
      this.priority = "medium";
    } else if (
      message.includes("feedback") ||
      message.includes("suggestion") ||
      message.includes("improve")
    ) {
      this.category = "feedback";
      this.priority = "medium";
    } else if (
      message.includes("partnership") ||
      message.includes("collaboration") ||
      message.includes("business")
    ) {
      this.category = "partnership";
      this.priority = "medium";
    }

    // Set high priority for urgent keywords
    if (
      message.includes("urgent") ||
      message.includes("emergency") ||
      message.includes("asap")
    ) {
      this.priority = "urgent";
    }
  }

  next();
});

// Static method to get contact statistics
contactSchema.statics.getStats = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        new: { $sum: { $cond: [{ $eq: ["$status", "new"] }, 1, 0] } },
        inProgress: {
          $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] },
        },
        resolved: { $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] } },
        closed: { $sum: { $cond: [{ $eq: ["$status", "closed"] }, 1, 0] } },
        urgent: { $sum: { $cond: [{ $eq: ["$priority", "urgent"] }, 1, 0] } },
        high: { $sum: { $cond: [{ $eq: ["$priority", "high"] }, 1, 0] } },
        unread: { $sum: { $cond: [{ $eq: ["$isRead", false] }, 1, 0] } },
      },
    },
  ]);

  return (
    stats[0] || {
      total: 0,
      new: 0,
      inProgress: 0,
      resolved: 0,
      closed: 0,
      urgent: 0,
      high: 0,
      unread: 0,
    }
  );
};

// Instance method to mark as read
contactSchema.methods.markAsRead = function (userId) {
  this.isRead = true;
  this.readAt = new Date();
  this.readBy = userId;
  return this.save();
};

// Instance method to respond to contact
contactSchema.methods.respond = function (response, userId) {
  this.response = response;
  this.respondedAt = new Date();
  this.respondedBy = userId;
  this.status = "resolved";
  return this.save();
};

const Contact = mongoose.model("Contact", contactSchema);

export default Contact;
