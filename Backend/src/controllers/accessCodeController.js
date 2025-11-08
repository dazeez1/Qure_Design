import { z } from "zod";
import { AccessCode } from "../models/AccessCode.js";
import crypto from "crypto";

const createAccessCodeSchema = z.object({
  hospitalName: z.string().min(1),
  permissions: z.array(
    z.enum([
      "queue_management",
      "appointments",
      "analytics",
      "staff_management",
    ])
  ),
  expiresAt: z.string().optional(),
  description: z.string().optional(),
});

const updateAccessCodeSchema = z.object({
  isActive: z.boolean().optional(),
  permissions: z
    .array(
      z.enum([
        "queue_management",
        "appointments",
        "analytics",
        "staff_management",
      ])
    )
    .optional(),
  expiresAt: z.string().optional(),
  description: z.string().optional(),
});

// Generate a random access code
function generateAccessCode() {
  const prefix = "QURE";
  const randomPart = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `${prefix}${randomPart}`;
}

// Create new access code
export const createAccessCode = async (req, res) => {
  try {
    const data = createAccessCodeSchema.parse(req.body);
    const createdBy = req.user.id;

    // Generate unique access code
    let code;
    let attempts = 0;
    do {
      code = generateAccessCode();
      attempts++;
      if (attempts > 10) {
        return res.status(500).json({
          success: false,
          message: "Failed to generate unique access code",
        });
      }
    } while (await AccessCode.findOne({ code }));

    // Parse expiration date if provided
    let expiresAt = null;
    if (data.expiresAt) {
      expiresAt = new Date(data.expiresAt);
      if (isNaN(expiresAt.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid expiration date format",
        });
      }
    }

    const accessCode = await AccessCode.create({
      code,
      hospitalName: data.hospitalName,
      permissions: data.permissions,
      createdBy,
      expiresAt,
      description: data.description,
    });

    res.status(201).json({
      success: true,
      message: "Access code created successfully",
      data: {
        id: accessCode._id,
        code: accessCode.code,
        hospitalName: accessCode.hospitalName,
        permissions: accessCode.permissions,
        expiresAt: accessCode.expiresAt,
        description: accessCode.description,
        createdAt: accessCode.createdAt,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Invalid input",
        errors: err.errors,
      });
    }
    console.error("Create access code error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to create access code",
    });
  }
};

// Get all access codes (admin only)
export const getAllAccessCodes = async (req, res) => {
  try {
    const { hospitalName, isActive, page = 1, limit = 20 } = req.query;

    const query = {};
    if (hospitalName) {
      query.hospitalName = new RegExp(hospitalName, "i");
    }
    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    const accessCodes = await AccessCode.find(query)
      .populate("createdBy", "firstName lastName email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await AccessCode.countDocuments(query);

    res.json({
      success: true,
      data: {
        accessCodes,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
        },
      },
    });
  } catch (error) {
    console.error("Get all access codes error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve access codes",
    });
  }
};

// Get access code by ID
export const getAccessCodeById = async (req, res) => {
  try {
    const { id } = req.params;

    const accessCode = await AccessCode.findById(id).populate(
      "createdBy",
      "firstName lastName email"
    );

    if (!accessCode) {
      return res.status(404).json({
        success: false,
        message: "Access code not found",
      });
    }

    res.json({
      success: true,
      data: accessCode,
    });
  } catch (error) {
    console.error("Get access code by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve access code",
    });
  }
};

// Update access code
export const updateAccessCode = async (req, res) => {
  try {
    const { id } = req.params;
    const data = updateAccessCodeSchema.parse(req.body);

    const accessCode = await AccessCode.findById(id);
    if (!accessCode) {
      return res.status(404).json({
        success: false,
        message: "Access code not found",
      });
    }

    // Parse expiration date if provided
    if (data.expiresAt !== undefined) {
      if (data.expiresAt === null || data.expiresAt === "") {
        accessCode.expiresAt = null;
      } else {
        const expiresAt = new Date(data.expiresAt);
        if (isNaN(expiresAt.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid expiration date format",
          });
        }
        accessCode.expiresAt = expiresAt;
      }
    }

    // Update other fields
    if (data.isActive !== undefined) accessCode.isActive = data.isActive;
    if (data.permissions !== undefined)
      accessCode.permissions = data.permissions;
    if (data.description !== undefined)
      accessCode.description = data.description;

    await accessCode.save();

    res.json({
      success: true,
      message: "Access code updated successfully",
      data: accessCode,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Invalid input",
        errors: err.errors,
      });
    }
    console.error("Update access code error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update access code",
    });
  }
};

// Delete access code
export const deleteAccessCode = async (req, res) => {
  try {
    const { id } = req.params;

    const accessCode = await AccessCode.findByIdAndDelete(id);
    if (!accessCode) {
      return res.status(404).json({
        success: false,
        message: "Access code not found",
      });
    }

    res.json({
      success: true,
      message: "Access code deleted successfully",
    });
  } catch (error) {
    console.error("Delete access code error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete access code",
    });
  }
};

// Get access code statistics
export const getAccessCodeStats = async (req, res) => {
  try {
    const totalCodes = await AccessCode.countDocuments();
    const activeCodes = await AccessCode.countDocuments({ isActive: true });
    const expiredCodes = await AccessCode.countDocuments({
      expiresAt: { $lt: new Date() },
    });

    const hospitalStats = await AccessCode.aggregate([
      {
        $group: {
          _id: "$hospitalName",
          count: { $sum: 1 },
          activeCount: {
            $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] },
          },
          totalUsage: { $sum: "$usageCount" },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json({
      success: true,
      data: {
        total: totalCodes,
        active: activeCodes,
        expired: expiredCodes,
        hospitalStats,
      },
    });
  } catch (error) {
    console.error("Get access code stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve access code statistics",
    });
  }
};
