import "dotenv/config";
import { connectDatabase } from "../src/config/db.js";
import { User } from "../src/models/User.js";
import jwt from "jsonwebtoken";

async function testStaffAppointments() {
  try {
    await connectDatabase(process.env.MONGODB_URI);
    console.log("Connected to database");

    // Find a Bera Clinic staff user
    const staffUser = await User.findOne({
      role: "staff",
      hospitalName: "Bera Clinic",
    });

    if (!staffUser) {
      console.log("No Bera Clinic staff found");
      return;
    }

    console.log("Found staff user:", staffUser.email);
    console.log("Hospital:", staffUser.hospitalName);

    // Create a JWT token for the staff user
    const token = jwt.sign(
      {
        id: staffUser._id,
        email: staffUser.email,
        role: staffUser.role,
        hospitalName: staffUser.hospitalName,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    console.log("Generated token:", token.substring(0, 50) + "...");

    // Test the API call
    const response = await fetch(
      "http://localhost:4000/api/appointments/hospital/all",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();
    console.log("\nAPI Response Status:", response.status);
    console.log("API Response:", JSON.stringify(data, null, 2));

    process.exit(0);
  } catch (error) {
    console.error("Error testing staff appointments:", error);
    process.exit(1);
  }
}

testStaffAppointments();
