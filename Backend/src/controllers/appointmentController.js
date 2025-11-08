import { Appointment } from "../models/Appointment.js";
import { Notification } from "../models/Notification.js";
import { sendEmail } from "../utils/email.js";
import { z } from "zod";

// Validation schemas
const createAppointmentSchema = z.object({
  doctor: z.string().min(1, "Doctor name is required"),
  specialty: z.string().min(1, "Specialty is required"),
  appointmentDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid appointment date",
  }),
  appointmentTime: z.string().min(1, "Appointment time is required"),
  notes: z.string().optional(),
  hospitalName: z.string().optional(),
  patientInfo: z.object({
    fullName: z.string().min(1, "Full name is required"),
    phoneNumber: z.string().min(10, "Valid phone number is required"),
    gender: z.enum(["male", "female", "other", "prefer-not-to-say"], {
      message: "Valid gender selection is required",
    }),
    dateOfBirth: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid date of birth",
    }),
  }),
});

const updateAppointmentSchema = z.object({
  doctor: z.string().min(1).optional(),
  specialty: z.string().min(1).optional(),
  appointmentDate: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)))
    .optional(),
  appointmentTime: z.string().min(1).optional(),
  notes: z.string().optional(),
  hospitalName: z.string().optional(),
});

// Create new appointment
export const createAppointment = async (req, res) => {
  try {
    const userId = req.user.id;
    const data = createAppointmentSchema.parse(req.body);

    // Check if appointment date is in the future
    const appointmentDate = new Date(data.appointmentDate);
    if (appointmentDate < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Appointment date must be in the future",
      });
    }

    const appointment = new Appointment({
      ...data,
      patient: userId,
      appointmentDate,
      hospitalName: data.hospitalName, // Ensure hospitalName is included
      patientInfo: {
        ...data.patientInfo,
        dateOfBirth: new Date(data.patientInfo.dateOfBirth),
      },
    });

    await appointment.save();

    // Update user's preferredHospital when appointment is created
    try {
      const { User } = await import("../models/User.js");
      await User.findByIdAndUpdate(userId, {
        $set: { preferredHospital: data.hospitalName || undefined },
      });
    } catch (_) {}

    // Create notification
    await Notification.create({
      user: userId,
      title: "Appointment Scheduled",
      message: `Your appointment with ${
        data.doctor
      } on ${appointmentDate.toDateString()} at ${
        data.appointmentTime
      } has been scheduled.`,
      type: "appointment_confirmed",
      relatedEntity: {
        type: "appointment",
        id: appointment._id,
      },
    });

    res.status(201).json({
      success: true,
      message: "Appointment created successfully",
      data: appointment,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    }

    console.error("Create appointment error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get user's appointments
export const getUserAppointments = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    const query = { patient: userId };
    if (status) {
      // Handle multiple status values (comma-separated)
      if (status.includes(",")) {
        const statusArray = status.split(",").map((s) => s.trim());
        query.status = { $in: statusArray };
      } else {
        query.status = status;
      }
    }

    const appointments = await Appointment.find(query)
      .sort({ appointmentDate: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Appointment.countDocuments(query);

    res.json({
      success: true,
      data: {
        appointments,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
        },
      },
    });
  } catch (error) {
    console.error("Get appointments error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Update appointment
export const updateAppointment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const data = updateAppointmentSchema.parse(req.body);

    const appointment = await Appointment.findOne({
      _id: id,
      patient: userId,
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Check if appointment can be modified
    if (
      appointment.status === "completed" ||
      appointment.status === "cancelled"
    ) {
      return res.status(400).json({
        success: false,
        message: "Cannot modify completed or cancelled appointments",
      });
    }

    // If date is being changed, validate it's in the future
    if (data.appointmentDate) {
      const newDate = new Date(data.appointmentDate);
      if (newDate < new Date()) {
        return res.status(400).json({
          success: false,
          message: "Appointment date must be in the future",
        });
      }
      data.appointmentDate = newDate;
    }

    Object.assign(appointment, data);
    await appointment.save();

    // Create notification
    await Notification.create({
      user: userId,
      title: "Appointment Updated",
      message: `Your appointment has been updated successfully.`,
      type: "appointment_confirmed",
      relatedEntity: {
        type: "appointment",
        id: appointment._id,
      },
    });

    res.json({
      success: true,
      message: "Appointment updated successfully",
      data: appointment,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    }

    console.error("Update appointment error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Reschedule appointment (Staff only)
export const rescheduleAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { appointmentDate, reason } = req.body;

    // Validate input
    if (!appointmentDate) {
      return res.status(400).json({
        success: false,
        message: "Appointment date is required",
      });
    }

    const appointment = await Appointment.findById(id).populate("patient");
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Check for conflicts with other appointments
    const conflictAppointment = await Appointment.findOne({
      _id: { $ne: id },
      appointmentDate: new Date(appointmentDate),
      status: { $in: ["scheduled", "confirmed", "checked-in"] },
      hospitalName: appointment.hospitalName,
    });

    if (conflictAppointment) {
      return res.status(409).json({
        success: false,
        message: "Time slot is already booked. Please choose a different time.",
      });
    }

    // Update appointment
    appointment.appointmentDate = new Date(appointmentDate);
    appointment.status = "scheduled"; // Reset to scheduled when rescheduled
    if (reason) {
      appointment.notes =
        (appointment.notes || "") + `\nRescheduled: ${reason}`;
    }
    await appointment.save();

    // Create notification for patient
    await Notification.create({
      user: appointment.patient._id,
      title: "Appointment Rescheduled",
      message: `Your appointment has been rescheduled to ${new Date(
        appointmentDate
      ).toLocaleDateString()} at ${new Date(
        appointmentDate
      ).toLocaleTimeString()}. ${reason ? `Reason: ${reason}` : ""}`,
      type: "appointment_rescheduled",
      priority: "high",
      relatedEntity: {
        type: "appointment",
        id: appointment._id,
      },
    });

    res.json({
      success: true,
      message: "Appointment rescheduled successfully",
      data: appointment,
    });
  } catch (error) {
    console.error("Reschedule appointment error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Cancel appointment
export const cancelAppointment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const appointment = await Appointment.findOne({
      _id: id,
      patient: userId,
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    if (appointment.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Appointment is already cancelled",
      });
    }

    if (appointment.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel completed appointment",
      });
    }

    appointment.status = "cancelled";
    await appointment.save();

    // Create notification
    await Notification.create({
      user: userId,
      title: "Appointment Cancelled",
      message: `Your appointment with ${appointment.doctor} has been cancelled.`,
      type: "appointment_cancelled",
      relatedEntity: {
        type: "appointment",
        id: appointment._id,
      },
    });

    res.json({
      success: true,
      message: "Appointment cancelled successfully",
      data: appointment,
    });
  } catch (error) {
    console.error("Cancel appointment error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get single appointment
export const getAppointment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const appointment = await Appointment.findOne({
      _id: id,
      patient: userId,
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    res.json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    console.error("Get appointment error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ===== STAFF APPOINTMENT FUNCTIONS =====

// Get all appointments for staff (hospital-wide)
export const getHospitalAppointments = async (req, res) => {
  try {
    const { hospitalName } = req.user;
    const { status, page = 1, limit = 50, search, department } = req.query;

    // Build query
    const query = { hospitalName };

    if (status) {
      if (status === "today") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        query.appointmentDate = { $gte: today, $lt: tomorrow };
      } else if (status === "upcoming") {
        query.appointmentDate = { $gte: new Date() };
        query.status = { $in: ["scheduled", "confirmed"] };
      } else if (status === "past") {
        query.appointmentDate = { $lt: new Date() };
      } else if (status === "cancelled") {
        query.status = "cancelled";
      } else {
        query.status = status;
      }
    }

    if (department) {
      query.specialty = { $regex: department, $options: "i" };
    }

    if (search) {
      query.$or = [
        { "patientInfo.fullName": { $regex: search, $options: "i" } },
        { specialty: { $regex: search, $options: "i" } },
      ];
    }

    const appointments = await Appointment.find(query)
      .populate("patient", "firstName lastName email phone")
      .sort({ appointmentDate: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Appointment.countDocuments(query);

    res.json({
      success: true,
      data: {
        appointments,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
        },
      },
    });
  } catch (error) {
    console.error("Get hospital appointments error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Update appointment status (staff only)
export const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const { hospitalName } = req.user;

    const appointment = await Appointment.findOne({
      _id: id,
      hospitalName,
    }).populate("patient", "firstName lastName email");

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    const oldStatus = appointment.status;
    appointment.status = status;
    if (notes) {
      appointment.notes = notes;
    }
    await appointment.save();

    // Create notification for patient
    const { Notification } = await import("../models/Notification.js");

    let notificationTitle = "Appointment Status Updated";
    let notificationMessage = `Your appointment status has been updated from ${oldStatus} to ${status}.`;
    let notificationType = "appointment_update";
    let notificationPriority = "medium";

    if (status === "completed") {
      notificationTitle = "Appointment Completed";
      notificationMessage = `Your appointment has been completed successfully. Thank you for choosing our services!`;
      notificationType = "appointment_completed";
      notificationPriority = "high";
    } else if (status === "confirmed") {
      notificationTitle = "Appointment Confirmed";
      notificationMessage = `Your appointment has been confirmed. Please arrive on time.`;
      notificationType = "appointment_confirmed";
      notificationPriority = "high";
    } else if (status === "checked-in") {
      notificationTitle = "Appointment Checked In";
      notificationMessage = `You have been checked in for your appointment. Please wait to be called.`;
      notificationType = "appointment_checked_in";
      notificationPriority = "medium";
    }

    await Notification.create({
      user: appointment.patient._id,
      title: notificationTitle,
      message: notificationMessage,
      type: notificationType,
      priority: notificationPriority,
      relatedEntity: {
        type: "appointment",
        id: appointment._id,
      },
    });

    res.json({
      success: true,
      message: "Appointment status updated successfully",
      data: appointment,
    });
  } catch (error) {
    console.error("Update appointment status error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Create new appointment (staff only)
export const createStaffAppointment = async (req, res) => {
  try {
    const { hospitalName } = req.user;
    const data = createAppointmentSchema.parse(req.body);

    // Check if appointment date is in the future
    const appointmentDate = new Date(data.appointmentDate);
    if (appointmentDate < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Appointment date must be in the future",
      });
    }

    const appointment = new Appointment({
      ...data,
      hospitalName,
      appointmentDate,
      patientInfo: {
        ...data.patientInfo,
        dateOfBirth: new Date(data.patientInfo.dateOfBirth),
      },
    });

    await appointment.save();

    // Create notification for patient if they exist in the system
    const { User } = await import("../models/User.js");
    const patient = await User.findOne({
      email: data.patientInfo.email,
      role: "patient",
    });

    if (patient) {
      const { Notification } = await import("../models/Notification.js");
      await Notification.create({
        user: patient._id,
        title: "New Appointment Scheduled",
        message: `A new appointment with ${
          data.doctor
        } on ${appointmentDate.toDateString()} at ${
          data.appointmentTime
        } has been scheduled for you.`,
        type: "appointment_confirmed",
        relatedEntity: {
          type: "appointment",
          id: appointment._id,
        },
      });
    }

    res.status(201).json({
      success: true,
      message: "Appointment created successfully",
      data: appointment,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    }

    console.error("Create staff appointment error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Edit appointment details (Staff only)
export const editAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const hospitalName = req.user.hospitalName;
    const staffId = req.user.id;

    // Enhanced validation schema for staff editing
    const editAppointmentSchema = z.object({
      doctor: z
        .string()
        .optional()
        .refine((val) => !val || val.length >= 1, {
          message: "Doctor name must not be empty if provided",
        }),
      specialty: z
        .string()
        .optional()
        .refine((val) => !val || val.length >= 1, {
          message: "Specialty must not be empty if provided",
        }),
      appointmentDate: z
        .string()
        .refine((date) => !isNaN(Date.parse(date)), {
          message: "Invalid appointment date",
        })
        .optional(),
      appointmentTime: z
        .string()
        .optional()
        .refine((val) => !val || val.length >= 1, {
          message: "Appointment time must not be empty if provided",
        }),
      notes: z.string().optional(),
      type: z
        .enum([
          "consultation",
          "follow-up",
          "emergency",
          "routine",
          "specialist",
          "general",
        ])
        .optional(),
      status: z
        .enum([
          "scheduled",
          "confirmed",
          "checked-in",
          "in-progress",
          "in-queue",
          "completed",
          "cancelled",
          "rescheduled",
          "no-show",
        ])
        .optional(),
      patientInfo: z
        .object({
          fullName: z
            .string()
            .optional()
            .refine((val) => !val || val.length >= 1, {
              message: "Full name must not be empty if provided",
            }),
          phoneNumber: z
            .string()
            .optional()
            .refine((val) => !val || val.length >= 10, {
              message:
                "Phone number must be at least 10 characters if provided",
            }),
          email: z
            .string()
            .optional()
            .refine(
              (val) => !val || z.string().email().safeParse(val).success,
              {
                message: "Valid email is required if provided",
              }
            ),
          gender: z
            .enum(["male", "female", "other", "prefer-not-to-say"])
            .optional(),
          dateOfBirth: z
            .string()
            .refine((date) => !isNaN(Date.parse(date)), {
              message: "Invalid date of birth",
            })
            .optional(),
        })
        .optional(),
    });

    const data = editAppointmentSchema.parse(req.body);

    // Find the appointment
    const appointment = await Appointment.findById(id).populate("patient");
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Verify the appointment belongs to the staff's hospital
    if (appointment.hospitalName !== hospitalName) {
      return res.status(403).json({
        success: false,
        message: "You can only edit appointments in your hospital",
      });
    }

    // Check if appointment can be modified
    if (appointment.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Cannot edit completed appointments",
      });
    }

    // If date is being changed, validate it's not in the past
    if (data.appointmentDate) {
      const newDate = new Date(data.appointmentDate);
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Reset time to start of day

      if (newDate < now) {
        return res.status(400).json({
          success: false,
          message: "Appointment date cannot be in the past",
        });
      }
      data.appointmentDate = newDate;
    }

    // Store original values for comparison
    const originalValues = {
      doctor: appointment.doctor,
      specialty: appointment.specialty,
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.appointmentTime,
      notes: appointment.notes,
      type: appointment.type,
      status: appointment.status,
    };

    // Update appointment fields
    Object.assign(appointment, data);

    // Update patient info if provided
    if (data.patientInfo) {
      if (!appointment.patientInfo) {
        appointment.patientInfo = {};
      }
      Object.assign(appointment.patientInfo, data.patientInfo);
    }

    await appointment.save();

    // Create notification for patient about the changes
    const changes = [];
    if (data.doctor && data.doctor !== originalValues.doctor) {
      changes.push(
        `Doctor changed from ${originalValues.doctor} to ${data.doctor}`
      );
    }
    if (data.specialty && data.specialty !== originalValues.specialty) {
      changes.push(
        `Department changed from ${originalValues.specialty} to ${data.specialty}`
      );
    }
    if (
      data.appointmentDate &&
      data.appointmentDate.getTime() !==
        originalValues.appointmentDate.getTime()
    ) {
      changes.push(
        `Date changed to ${data.appointmentDate.toLocaleDateString()}`
      );
    }
    if (
      data.appointmentTime &&
      data.appointmentTime !== originalValues.appointmentTime
    ) {
      changes.push(`Time changed to ${data.appointmentTime}`);
    }
    if (data.notes && data.notes !== originalValues.notes) {
      changes.push("Notes have been updated");
    }
    if (data.status && data.status !== originalValues.status) {
      changes.push(`Status changed to ${data.status}`);
    }

    if (changes.length > 0) {
      const notification = new Notification({
        user: appointment.patient._id,
        title: "Appointment Details Updated",
        message: `Your appointment has been updated: ${changes.join(", ")}`,
        type: "appointment_reminder",
        priority: "medium",
        relatedEntity: {
          type: "appointment",
          id: appointment._id,
        },
      });

      await notification.save();

      // Send email notification for significant changes
      if (data.appointmentDate || data.appointmentTime || data.status) {
        try {
          const patient = appointment.patient;
          if (patient && patient.email) {
            await sendEmail({
              to: patient.email,
              subject: `Appointment Update - ${hospitalName}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #2563eb;">Appointment Update</h2>
                  <p>Your appointment details have been updated:</p>
                  <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">Updated Information:</h3>
                    <ul style="margin: 0; padding-left: 20px;">
                      ${changes.map((change) => `<li>${change}</li>`).join("")}
                    </ul>
                  </div>
                  <p style="color: #6b7280; font-size: 14px;">
                    Please log in to your patient portal to view the complete updated information.
                  </p>
                </div>
              `,
            });
          }
        } catch (emailError) {
          console.error("Failed to send email notification:", emailError);
          // Don't fail the edit if email fails
        }
      }
    }

    // Populate the response
    await appointment.populate("patient", "firstName lastName email phone");

    res.status(200).json({
      success: true,
      message: "Appointment updated successfully",
      data: appointment,
      changes: changes.length > 0 ? changes : ["No significant changes made"],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    }

    console.error("Edit appointment error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
