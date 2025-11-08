import "dotenv/config";
import { connectDatabase } from "../src/config/db.js";
import { User } from "../src/models/User.js";
import jwt from "jsonwebtoken";

async function regenerateStaffToken() {
  try {
    await connectDatabase(process.env.MONGODB_URI);
    console.log("Connected to database");

    // Find the Bera Clinic staff user
    const staffUser = await User.findOne({
      role: "staff",
      hospitalName: "Bera Clinic",
    });

    if (!staffUser) {
      console.log("No Bera Clinic staff found");
      return;
    }

    console.log("Staff user found:");
    console.log("Email:", staffUser.email);
    console.log("Hospital:", staffUser.hospitalName);

    // Generate a new JWT token with the correct hospitalName
    const token = jwt.sign(
      {
        id: staffUser._id,
        email: staffUser.email,
        role: staffUser.role,
        hospitalName: staffUser.hospitalName,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    console.log("\n✅ New JWT token generated:");
    console.log("Token:", token);
    console.log("\n📋 Instructions:");
    console.log("1. Open browser Developer Tools (F12)");
    console.log("2. Go to Application/Storage tab");
    console.log("3. Find localStorage");
    console.log("4. Replace the 'authToken' value with the token above");
    console.log("5. Refresh the appointments page");

    // Also decode the token to show what's inside
    const decoded = jwt.decode(token);
    console.log("\n🔍 Token payload:");
    console.log(JSON.stringify(decoded, null, 2));

    process.exit(0);
  } catch (error) {
    console.error("Error regenerating staff token:", error);
    process.exit(1);
  }
}

regenerateStaffToken();
