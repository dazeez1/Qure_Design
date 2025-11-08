import bcrypt from "bcrypt";
import { z } from "zod";
import crypto from "crypto";
import { User } from "../models/User.js";
import { signAuthToken } from "../utils/jwt.js";
import {
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendAccessCodeEmail,
} from "../utils/email.js";

const registerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(10).max(20),
  password: z.string().min(8),
  role: z.enum(["patient", "staff"]),
  hospitalName: z.string().optional(),
  gender: z.enum(["male", "female", "other", "prefer-not-to-say"]).optional(),
  dateOfBirth: z.string().optional(),
});

const loginSchema = z.object({
  emailOrPhone: z.string().min(3),
  password: z.string().min(8),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

const accessCodeSchema = z.object({
  accessCode: z.string().min(4),
});

// Function to get or create access code for hospital
async function getOrCreateHospitalAccessCode(user, hospitalName) {
  try {
    // Import AccessCode model dynamically to avoid circular imports
    const { AccessCode } = await import("../models/AccessCode.js");

    // First, check if this hospital already has an active access code
    let existingAccessCode = await AccessCode.findOne({
      hospitalName: hospitalName,
      isActive: true,
    });

    if (existingAccessCode) {
      // Hospital already has an access code, send it to the new staff member

      // Send the existing access code via email
      await sendAccessCodeEmail(
        user.email,
        user.firstName,
        existingAccessCode.code,
        hospitalName
      );

      return existingAccessCode;
    }

    // Hospital doesn't have an access code yet, generate a new one

    let code;
    let attempts = 0;
    do {
      const prefix = "QURE";
      const randomPart = crypto.randomBytes(3).toString("hex").toUpperCase();
      code = `${prefix}${randomPart}`;
      attempts++;
      if (attempts > 10) {
        throw new Error("Failed to generate unique access code");
      }
    } while (await AccessCode.findOne({ code }));

    // Create new access code record for this hospital
    const newAccessCode = await AccessCode.create({
      code,
      hospitalName,
      permissions: [
        "queue_management",
        "appointments",
        "analytics",
        "staff_management",
      ],
      createdBy: user._id,
      description: `Auto-generated access code for ${hospitalName} staff`,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    });

    // Send the new access code via email
    await sendAccessCodeEmail(user.email, user.firstName, code, hospitalName);

    console.log(`New access code generated and sent to ${user.email}: ${code}`);
    return newAccessCode;
  } catch (error) {
    console.error("Error getting/creating access code:", error);
    throw error;
  }
}

export async function register(req, res) {
  try {
    const data = registerSchema.parse(req.body);
    const existing = await User.findOne({ email: data.email });
    if (existing)
      return res.status(409).json({ message: "Email already registered" });

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await User.create({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      passwordHash,
      role: data.role,
      hospitalName: data.role === "staff" ? data.hospitalName : undefined,
      gender: data.gender,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
    });

    const token = signAuthToken(
      {
        userId: user.id,
        role: user.role,
        firstName: user.firstName,
        hospitalName: user.hospitalName,
      },
      process.env.JWT_SECRET
    );

    // Send welcome email
    try {
      await sendWelcomeEmail(user.email, user.firstName);
      console.log(`Welcome email sent to ${user.email}`);
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
      // Don't fail registration if email fails
    }

    // Get or create access code for staff
    if (data.role === "staff" && data.hospitalName) {
      try {
        await getOrCreateHospitalAccessCode(user, data.hospitalName);
        console.log(`Access code processed for staff: ${user.email}`);

        // Ensure hospital exists in catalog for patient booking lists
        try {
          const { Hospital } = await import("../models/Hospital.js");
          const code = data.hospitalName
            .toUpperCase()
            .replace(/[^A-Z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
          await Hospital.updateOne(
            { name: data.hospitalName },
            { $setOnInsert: { name: data.hospitalName, code } },
            { upsert: true }
          );
        } catch (e) {
          console.error("Failed to upsert hospital record:", e);
        }
      } catch (accessCodeError) {
        console.error("Failed to process access code:", accessCodeError);
        // Don't fail registration if access code generation fails
      }
    }

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        hospitalName: user.hospitalName,
        preferredHospital: user.preferredHospital,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: "Invalid input", errors: err.errors });
    }
    return res.status(500).json({ message: "Registration failed" });
  }
}

export async function login(req, res) {
  try {
    const { emailOrPhone, password } = loginSchema.parse(req.body);
    const user = await User.findOne({
      $or: [{ email: emailOrPhone }, { phone: emailOrPhone }],
    });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = signAuthToken(
      {
        userId: user.id,
        role: user.role,
        firstName: user.firstName,
        hospitalName: user.hospitalName,
      },
      process.env.JWT_SECRET
    );

    // Track staff login if user is staff
    if (user.role === "staff" && user.hospitalName) {
      try {
        const { StaffActivity } = await import("../models/StaffActivity.js");
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.get("User-Agent");

        await StaffActivity.findOneAndUpdate(
          { staff: user._id, hospitalName: user.hospitalName },
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
      } catch (error) {
        console.error("Error tracking staff login:", error);
        // Don't fail login if tracking fails
      }
    }

    return res.json({
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        hospitalName: user.hospitalName,
        preferredHospital: user.preferredHospital,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: "Invalid input", errors: err.errors });
    }
    return res.status(500).json({ message: "Login failed" });
  }
}

export async function forgotPassword(req, res) {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists or not for security
      return res.json({
        message:
          "If an account with that email exists, we've sent a password reset link.",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save reset token to user
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiry = resetTokenExpiry;
    await user.save();

    // Send password reset email
    try {
      await sendPasswordResetEmail(email, resetToken);
      console.log(`Password reset email sent to ${email}`);
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
      // Still return success to user for security (don't reveal email issues)
    }

    return res.json({
      message:
        "If an account with that email exists, we've sent a password reset link.",
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: "Invalid email", errors: err.errors });
    }
    return res.status(500).json({ message: "Password reset request failed" });
  }
}

export async function resetPassword(req, res) {
  try {
    const { token, password } = resetPasswordSchema.parse(req.body);

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: new Date() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 10);

    // Update user password and clear reset token
    user.passwordHash = passwordHash;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    return res.json({ message: "Password reset successfully" });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: "Invalid input", errors: err.errors });
    }
    return res.status(500).json({ message: "Password reset failed" });
  }
}

export async function validateAccessCode(req, res) {
  try {
    const { accessCode } = accessCodeSchema.parse(req.body);

    // Import AccessCode model
    const { AccessCode } = await import("../models/AccessCode.js");

    // Find access code in database
    const codeRecord = await AccessCode.findOne({
      code: accessCode.toUpperCase(),
      isActive: true,
    });

    if (!codeRecord) {
      return res.status(401).json({
        message:
          "Invalid access code. Please check your email for the correct access code or contact your administrator.",
      });
    }

    // Check if code is expired
    if (codeRecord.expiresAt && new Date() > codeRecord.expiresAt) {
      return res.status(401).json({
        message: "Access code has expired. Please contact your administrator.",
      });
    }

    // Increment usage count
    await codeRecord.incrementUsage();

    // Log access code usage for security
    console.log(
      `Access code validated: ${accessCode} for ${
        codeRecord.hospitalName
      } (Usage: ${codeRecord.usageCount + 1})`
    );

    return res.json({
      message: "Access code validated successfully",
      hospitalName: codeRecord.hospitalName,
      permissions: codeRecord.permissions,
      accessCode: accessCode,
      expiresAt: codeRecord.expiresAt,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: "Invalid access code format", errors: err.errors });
    }
    console.error("Access code validation error:", err);
    return res.status(500).json({ message: "Access code validation failed" });
  }
}
