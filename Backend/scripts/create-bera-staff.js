import "dotenv/config";
import { connectDatabase } from "../src/config/db.js";
import { User } from "../src/models/User.js";
import { AccessCode } from "../src/models/AccessCode.js";
import bcrypt from "bcrypt";

async function createBeraStaff() {
  try {
    await connectDatabase(process.env.MONGODB_URI);
    console.log("Connected to database");

    // Check if Bera Clinic staff already exists
    const existingStaff = await User.findOne({
      role: "staff",
      hospitalName: "Bera Clinic",
    });

    if (existingStaff) {
      console.log("Bera Clinic staff already exists:", existingStaff.email);
      console.log("Staff ID:", existingStaff._id);
      return;
    }

    // Create Bera Clinic staff user
    const hashedPassword = await bcrypt.hash("1234567890", 10);

    const staffUser = new User({
      firstName: "Dr. Sarah",
      lastName: "Johnson",
      email: "sarah.johnson@beraclinic.com",
      phone: "555-0123",
      password: hashedPassword,
      role: "staff",
      hospitalName: "Bera Clinic",
      isEmailVerified: true,
    });

    await staffUser.save();

    // Create or get access code for Bera Clinic
    let accessCode = await AccessCode.findOne({ hospitalName: "Bera Clinic" });

    if (!accessCode) {
      accessCode = new AccessCode({
        code: "BERA2024",
        hospitalName: "Bera Clinic",
        createdBy: staffUser._id,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        isActive: true,
      });
      await accessCode.save();
    }

    console.log("✅ Bera Clinic staff created successfully!");
    console.log("Email:", staffUser.email);
    console.log("Password: 1234567890");
    console.log("Hospital:", staffUser.hospitalName);
    console.log("Access Code:", accessCode.code);
    console.log("Staff ID:", staffUser._id);

    process.exit(0);
  } catch (error) {
    console.error("Error creating Bera Clinic staff:", error);
    process.exit(1);
  }
}

createBeraStaff();
