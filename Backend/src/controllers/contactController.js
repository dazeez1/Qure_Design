import Contact from "../models/Contact.js";
import { z } from "zod";

// Validation schemas
const createContactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  message: z.string().min(10).max(1000),
  subject: z.string().max(200).optional(),
  category: z
    .enum([
      "general",
      "support",
      "feedback",
      "complaint",
      "partnership",
      "other",
    ])
    .optional(),
  source: z
    .enum(["website", "mobile_app", "email", "phone", "social_media", "other"])
    .optional(),
});

const updateContactSchema = z.object({
  status: z.enum(["new", "in_progress", "resolved", "closed"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  assignedTo: z.string().optional(),
  response: z.string().max(2000).optional(),
  tags: z.array(z.string().max(50)).optional(),
});

// Create contact message
export const createContact = async (req, res) => {
  try {
    // Validate request body
    const validationResult = createContactSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationResult.error.errors,
      });
    }

    const {
      name,
      email,
      message,
      subject = "General Inquiry",
      category = "general",
      source = "website",
    } = validationResult.data;

    // Create contact message
    const contact = new Contact({
      name,
      email,
      message,
      subject,
      category,
      source,
      userAgent: req.get("User-Agent"),
      ipAddress: req.ip,
    });

    await contact.save();

    res.status(201).json({
      success: true,
      message: "Contact message sent successfully",
      data: {
        id: contact._id,
        name: contact.name,
        email: contact.email,
        subject: contact.subject,
        category: contact.category,
        status: contact.status,
        priority: contact.priority,
        createdAt: contact.createdAt,
        timeAgo: contact.timeAgo,
      },
    });
  } catch (error) {
    console.error("Error creating contact message:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send contact message",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// Get all contact messages (Admin/Staff only)
export const getAllContacts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      category,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } },
        { message: { $regex: search, $options: "i" } },
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get contacts with pagination
    const contacts = await Contact.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("assignedTo", "firstName lastName email")
      .populate("respondedBy", "firstName lastName email")
      .populate("readBy", "firstName lastName email");

    // Get total count
    const total = await Contact.countDocuments(filter);

    res.json({
      success: true,
      data: {
        contacts,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit),
          hasNextPage: skip + contacts.length < total,
          hasPrevPage: parseInt(page) > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error getting contact messages:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve contact messages",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// Get contact message by ID
export const getContactById = async (req, res) => {
  try {
    console.log("Contact ID:", req.params.id);
    console.log("User ID:", req.user.id);

    const contact = await Contact.findById(req.params.id)
      .populate("assignedTo", "firstName lastName email")
      .populate("respondedBy", "firstName lastName email")
      .populate("readBy", "firstName lastName email");

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact message not found",
      });
    }

    // Mark as read if not already read
    if (!contact.isRead) {
      await contact.markAsRead(req.user.id);
    }

    console.log("Contact message retrieved successfully");

    res.json({
      success: true,
      data: { contact },
    });
  } catch (error) {
    console.error("Error getting contact message:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve contact message",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// Update contact message
export const updateContact = async (req, res) => {
  try {
    console.log("Contact ID:", req.params.id);
    console.log("User ID:", req.user.id);
    console.log("Update data:", req.body);

    // Validate request body
    const validationResult = updateContactSchema.safeParse(req.body);
    if (!validationResult.success) {
      console.log("Validation errors:", validationResult.error.errors);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationResult.error.errors,
      });
    }

    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact message not found",
      });
    }

    // Update contact
    Object.assign(contact, validationResult.data);
    await contact.save();

    console.log("Contact message updated successfully");

    res.json({
      success: true,
      message: "Contact message updated successfully",
      data: { contact },
    });
  } catch (error) {
    console.error("Error updating contact message:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update contact message",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// Respond to contact message
export const respondToContact = async (req, res) => {
  try {
    console.log("Contact ID:", req.params.id);
    console.log("User ID:", req.user.id);
    console.log("Response:", req.body.response);

    const { response } = req.body;

    if (!response || response.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: "Response must be at least 10 characters long",
      });
    }

    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact message not found",
      });
    }

    // Respond to contact
    await contact.respond(response, req.user.id);

    console.log("Response sent successfully");

    res.json({
      success: true,
      message: "Response sent successfully",
      data: { contact },
    });
  } catch (error) {
    console.error("Error responding to contact message:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send response",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// Delete contact message
export const deleteContact = async (req, res) => {
  try {
    console.log("Contact ID:", req.params.id);
    console.log("User ID:", req.user.id);

    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact message not found",
      });
    }

    await Contact.findByIdAndDelete(req.params.id);

    console.log("Contact message deleted successfully");

    res.json({
      success: true,
      message: "Contact message deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting contact message:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete contact message",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// Get contact statistics
export const getContactStats = async (req, res) => {
  try {
    console.log("User ID:", req.user.id);

    const stats = await Contact.getStats();

    // Get additional statistics
    const categoryStats = await Contact.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const priorityStats = await Contact.aggregate([
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const recentContacts = await Contact.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name email subject status priority createdAt");

    console.log("Contact statistics retrieved successfully");

    res.json({
      success: true,
      data: {
        overview: stats,
        categoryBreakdown: categoryStats,
        priorityBreakdown: priorityStats,
        recentContacts,
      },
    });
  } catch (error) {
    console.error("Error getting contact statistics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve contact statistics",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// Mark contact as read
export const markContactAsRead = async (req, res) => {
  try {
    console.log("Contact ID:", req.params.id);
    console.log("User ID:", req.user.id);

    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact message not found",
      });
    }

    await contact.markAsRead(req.user.id);

    console.log("Contact marked as read successfully");

    res.json({
      success: true,
      message: "Contact marked as read",
      data: { contact },
    });
  } catch (error) {
    console.error("Error marking contact as read:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark contact as read",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};
