import { HospitalSettings } from "../models/HospitalSettings.js";
import { Department } from "../models/Department.js";
import { StaffActivity } from "../models/StaffActivity.js";
import { User } from "../models/User.js";
import { z } from "zod";

// ===== ORGANIZATION SETTINGS =====

// Validation schema for organization settings
const organizationSettingsSchema = z.object({
  hospitalName: z.string().min(1, "Hospital name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  logo: z.string().optional(),
  description: z.string().optional(),
  specialties: z.array(z.string()).optional(),
  operatingHours: z
    .object({
      monday: z.object({ open: z.string(), close: z.string() }).optional(),
      tuesday: z.object({ open: z.string(), close: z.string() }).optional(),
      wednesday: z.object({ open: z.string(), close: z.string() }).optional(),
      thursday: z.object({ open: z.string(), close: z.string() }).optional(),
      friday: z.object({ open: z.string(), close: z.string() }).optional(),
      saturday: z.object({ open: z.string(), close: z.string() }).optional(),
      sunday: z.object({ open: z.string(), close: z.string() }).optional(),
    })
    .optional(),
  emergencyContact: z
    .object({
      phone: z.string().optional(),
      available: z.boolean().optional(),
    })
    .optional(),
  timezone: z.string().optional(),
  capacityThresholds: z
    .object({
      low: z.number().min(0).max(1000),
      medium: z.number().min(0).max(1000),
      high: z.number().min(0).max(1000),
    })
    .optional(),
});

// Get organization settings
export const getOrganizationSettings = async (req, res) => {
  try {
    const { hospitalName } = req.user;

    const settings = await HospitalSettings.findOne({ hospitalName });

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: "Organization settings not found",
      });
    }

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Get organization settings error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Update organization settings
export const updateOrganizationSettings = async (req, res) => {
  try {
    const { hospitalName } = req.user;
    const userId = req.user.id;
    const data = organizationSettingsSchema.parse(req.body);

    // Check if settings exist
    let settings = await HospitalSettings.findOne({ hospitalName });

    if (settings) {
      // Update existing settings
      Object.assign(settings, data);
      await settings.save();
    } else {
      // Create new settings
      settings = await HospitalSettings.create({
        ...data,
        hospitalName,
        createdBy: userId,
      });
    }

    res.json({
      success: true,
      message: "Organization settings updated successfully",
      data: settings,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    }

    console.error("Update organization settings error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ===== DEPARTMENTS MANAGEMENT =====

// Validation schema for department
const departmentSchema = z.object({
  name: z.string().min(1, "Department name is required"),
  shortCode: z.string().min(2, "Short code must be at least 2 characters"),
  status: z.enum(["active", "inactive"]).default("active"),
  description: z.string().optional(),
  capacity: z.number().min(1).default(50),
});

// Get all departments for hospital
export const getDepartments = async (req, res) => {
  try {
    const { hospitalName } = req.user;

    const departments = await Department.find({ hospitalName })
      .populate("createdBy", "firstName lastName")
      .sort({ name: 1 });

    res.json({
      success: true,
      data: departments,
    });
  } catch (error) {
    console.error("Get departments error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get public departments (for patients to see available departments)
export const getPublicDepartments = async (req, res) => {
  try {
    const { hospitalName } = req.query;

    if (!hospitalName) {
      return res.status(400).json({
        success: false,
        message: "Hospital name is required",
      });
    }

    const departments = await Department.find({
      hospitalName,
      status: "active",
    })
      .select("name shortCode description capacity currentOccupancy")
      .sort({ name: 1 });

    res.json({
      success: true,
      data: departments,
    });
  } catch (error) {
    console.error("Get public departments error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Create new department
export const createDepartment = async (req, res) => {
  try {
    const { hospitalName } = req.user;
    const userId = req.user.id;
    const data = departmentSchema.parse(req.body);

    // Check if department with same name or short code exists
    const existingDepartment = await Department.findOne({
      hospitalName,
      $or: [{ name: data.name }, { shortCode: data.shortCode.toUpperCase() }],
    });

    if (existingDepartment) {
      return res.status(409).json({
        success: false,
        message: "Department with this name or short code already exists",
      });
    }

    const department = await Department.create({
      ...data,
      hospitalName,
      shortCode: data.shortCode.toUpperCase(),
      createdBy: userId,
    });

    await department.populate("createdBy", "firstName lastName");

    res.status(201).json({
      success: true,
      message: "Department created successfully",
      data: department,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    }

    console.error("Create department error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Update department
export const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { hospitalName } = req.user;
    const data = departmentSchema.partial().parse(req.body);

    const department = await Department.findOne({
      _id: id,
      hospitalName,
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    // Check for conflicts if updating name or short code
    if (data.name || data.shortCode) {
      const conflictQuery = {
        hospitalName,
        _id: { $ne: id },
        $or: [],
      };

      if (data.name) {
        conflictQuery.$or.push({ name: data.name });
      }
      if (data.shortCode) {
        conflictQuery.$or.push({ shortCode: data.shortCode.toUpperCase() });
      }

      const conflict = await Department.findOne(conflictQuery);
      if (conflict) {
        return res.status(409).json({
          success: false,
          message: "Department with this name or short code already exists",
        });
      }
    }

    Object.assign(department, data);
    if (data.shortCode) {
      department.shortCode = data.shortCode.toUpperCase();
    }

    await department.save();
    await department.populate("createdBy", "firstName lastName");

    res.json({
      success: true,
      message: "Department updated successfully",
      data: department,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    }

    console.error("Update department error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Delete department
export const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { hospitalName } = req.user;

    const department = await Department.findOne({
      _id: id,
      hospitalName,
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    await Department.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Department deleted successfully",
    });
  } catch (error) {
    console.error("Delete department error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ===== STAFF ACTIVITY TRACKING =====

// Get all staff for hospital with activity status
export const getStaffWithActivity = async (req, res) => {
  try {
    const { hospitalName } = req.user;

    // Get all staff for this hospital
    const staff = await User.find({
      role: "staff",
      hospitalName,
    }).select("firstName lastName email phone createdAt");

    // Get latest activity for each staff member
    const staffWithActivity = await Promise.all(
      staff.map(async (staffMember) => {
        const latestActivity = await StaffActivity.findOne({
          staff: staffMember._id,
          hospitalName,
        }).sort({ lastActivityAt: -1 });

        return {
          ...staffMember.toObject(),
          isActive: latestActivity ? latestActivity.isActive : false,
          lastActivityAt: latestActivity ? latestActivity.lastActivityAt : null,
          lastActivity: latestActivity ? latestActivity.activity : "never",
        };
      })
    );

    res.json({
      success: true,
      data: staffWithActivity,
    });
  } catch (error) {
    console.error("Get staff with activity error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Track staff login
export const trackStaffLogin = async (req, res) => {
  try {
    const { hospitalName } = req.user;
    const userId = req.user.id;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get("User-Agent");

    // Create or update activity record
    await StaffActivity.findOneAndUpdate(
      { staff: userId, hospitalName },
      {
        $set: {
          activity: "login",
          isActive: true,
          lastActivityAt: new Date(),
          ipAddress,
          userAgent,
        },
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: "Staff login tracked",
    });
  } catch (error) {
    console.error("Track staff login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Track staff logout
export const trackStaffLogout = async (req, res) => {
  try {
    const { hospitalName } = req.user;
    const userId = req.user.id;

    // Update activity record
    await StaffActivity.findOneAndUpdate(
      { staff: userId, hospitalName },
      {
        $set: {
          activity: "logout",
          isActive: false,
          lastActivityAt: new Date(),
        },
      }
    );

    res.json({
      success: true,
      message: "Staff logout tracked",
    });
  } catch (error) {
    console.error("Track staff logout error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
