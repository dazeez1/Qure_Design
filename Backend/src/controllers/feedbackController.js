import Feedback from "../models/Feedback.js";
import { z } from "zod";

// Validation schemas
const createFeedbackSchema = z.object({
  rating: z.number().min(1).max(5),
  comments: z.string().min(10).max(500),
  visitType: z.enum(["appointment", "queue", "general"]).optional(),
  doctorName: z.string().optional(),
  specialty: z.string().optional(),
  hospitalName: z.string().optional(),
  visitDate: z.string().optional(),
  isAnonymous: z.boolean().optional(),
});

// Create feedback
export const createFeedback = async (req, res) => {
  try {
    // Validate request body
    const validationResult = createFeedbackSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationResult.error.errors,
      });
    }

    const {
      rating,
      comments,
      visitType = "general",
      doctorName,
      specialty,
      hospitalName,
      visitDate,
      isAnonymous = false,
    } = validationResult.data;

    // Create feedback
    const feedback = new Feedback({
      patient: req.user.id,
      rating,
      comments,
      visitType,
      doctorName,
      specialty,
      hospitalName,
      visitDate: visitDate ? new Date(visitDate) : new Date(),
      isAnonymous,
    });

    await feedback.save();

    // Populate patient data for response
    await feedback.populate("patient", "firstName lastName email");

    res.status(201).json({
      success: true,
      message: "Feedback submitted successfully",
      data: {
        id: feedback._id,
        rating: feedback.rating,
        comments: feedback.comments,
        visitType: feedback.visitType,
        doctorName: feedback.doctorName,
        specialty: feedback.specialty,
        hospitalName: feedback.hospitalName,
        visitDate: feedback.visitDate,
        isAnonymous: feedback.isAnonymous,
        patientName: feedback.patientName,
        createdAt: feedback.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating feedback:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit feedback",
      error: error.message,
    });
  }
};

// Get user's feedback
export const getUserFeedback = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const feedback = await Feedback.find({ patient: req.user.id })
      .populate("patient", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Feedback.countDocuments({ patient: req.user.id });

    res.json({
      success: true,
      data: {
        feedback: feedback.map((item) => ({
          id: item._id,
          rating: item.rating,
          comments: item.comments,
          visitType: item.visitType,
          doctorName: item.doctorName,
          specialty: item.specialty,
          hospitalName: item.hospitalName,
          visitDate: item.visitDate,
          isAnonymous: item.isAnonymous,
          patientName: item.patientName,
          status: item.status,
          createdAt: item.createdAt,
        })),
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: feedback.length,
          totalCount: total,
        },
      },
    });
  } catch (error) {
    console.error("Error getting user feedback:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve feedback",
      error: error.message,
    });
  }
};

// Get all feedback (for admin/staff)
export const getAllFeedback = async (req, res) => {
  try {
    const { page = 1, limit = 20, rating, status, hospitalName } = req.query;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    if (rating) filter.rating = parseInt(rating);
    if (status) filter.status = status;
    if (hospitalName) filter.hospitalName = new RegExp(hospitalName, "i");

    const feedback = await Feedback.find(filter)
      .populate("patient", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Feedback.countDocuments(filter);

    res.json({
      success: true,
      data: {
        feedback: feedback.map((item) => ({
          id: item._id,
          rating: item.rating,
          comments: item.comments,
          visitType: item.visitType,
          doctorName: item.doctorName,
          specialty: item.specialty,
          hospitalName: item.hospitalName,
          visitDate: item.visitDate,
          isAnonymous: item.isAnonymous,
          patientName: item.patientName,
          patientEmail: item.isAnonymous ? null : item.patient?.email,
          status: item.status,
          createdAt: item.createdAt,
        })),
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: feedback.length,
          totalCount: total,
        },
      },
    });
  } catch (error) {
    console.error("Error getting all feedback:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve feedback",
      error: error.message,
    });
  }
};

// Get feedback statistics
export const getFeedbackStats = async (req, res) => {
  try {
    const stats = await Feedback.aggregate([
      {
        $group: {
          _id: null,
          totalFeedback: { $sum: 1 },
          averageRating: { $avg: "$rating" },
          ratingDistribution: {
            $push: "$rating",
          },
        },
      },
    ]);

    const ratingCounts = await Feedback.aggregate([
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: -1 },
      },
    ]);

    const hospitalStats = await Feedback.aggregate([
      {
        $group: {
          _id: "$hospitalName",
          count: { $sum: 1 },
          averageRating: { $avg: "$rating" },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    const result = {
      totalFeedback: stats[0]?.totalFeedback || 0,
      averageRating: Math.round((stats[0]?.averageRating || 0) * 10) / 10,
      ratingDistribution: ratingCounts.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      topHospitals: hospitalStats,
    };

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error getting feedback stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve feedback statistics",
      error: error.message,
    });
  }
};

// Update feedback status (for admin/staff)
export const updateFeedbackStatus = async (req, res) => {
  try {
    console.log("Feedback ID:", req.params.id);
    console.log("New status:", req.body.status);

    const { status } = req.body;

    if (!["pending", "reviewed", "resolved"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be pending, reviewed, or resolved",
      });
    }

    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate("patient", "firstName lastName email");

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found",
      });
    }

    console.log("Feedback status updated successfully");

    res.json({
      success: true,
      message: "Feedback status updated successfully",
      data: {
        id: feedback._id,
        status: feedback.status,
        updatedAt: feedback.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error updating feedback status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update feedback status",
      error: error.message,
    });
  }
};

// Delete feedback
export const deleteFeedback = async (req, res) => {
  try {
    console.log("Feedback ID:", req.params.id);
    console.log("User ID:", req.user.id);

    const feedback = await Feedback.findOne({
      _id: req.params.id,
      patient: req.user.id,
    });

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found or you don't have permission to delete it",
      });
    }

    await Feedback.findByIdAndDelete(req.params.id);

    console.log("Feedback deleted successfully");

    res.json({
      success: true,
      message: "Feedback deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting feedback:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete feedback",
      error: error.message,
    });
  }
};
