import "dotenv/config";
import { connectDatabase } from "../src/config/db.js";
import { User } from "../src/models/User.js";
import jwt from "jsonwebtoken";

async function debugJwtToken() {
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
    console.log("ID:", staffUser._id);
    console.log("Email:", staffUser.email);
    console.log("Hospital:", staffUser.hospitalName);
    console.log("Role:", staffUser.role);

    // Create a JWT token exactly like the backend does
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

    console.log("\nGenerated JWT token:");
    console.log("Token:", token.substring(0, 100) + "...");

    // Decode the token to see what's inside
    const decoded = jwt.decode(token);
    console.log("\nDecoded JWT payload:");
    console.log(JSON.stringify(decoded, null, 2));

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
    console.log("\nAPI Response:");
    console.log("Status:", response.status);
    console.log("Data:", JSON.stringify(data, null, 2));

    process.exit(0);
  } catch (error) {
    console.error("Error debugging JWT token:", error);
    process.exit(1);
  }
}

debugJwtToken();
