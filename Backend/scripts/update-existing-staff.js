import "dotenv/config";
import { connectDatabase } from "../src/config/db.js";
import { User } from "../src/models/User.js";
import { StaffActivity } from "../src/models/StaffActivity.js";

async function updateExistingStaff() {
  try {
    await connectDatabase(process.env.MONGODB_URI);
    console.log("Connected to database");

    // Update existing Bera staff
    const existingStaff = await User.findOne({
      email: "kvngdrey8@gmail.com",
      hospitalName: "Bera Clinic",
    });

    if (existingStaff) {
      await StaffActivity.findOneAndUpdate(
        { staff: existingStaff._id, hospitalName: "Bera Clinic" },
        {
          $set: {
            activity: "login",
            isActive: true,
            lastActivityAt: new Date(),
            ipAddress: "127.0.0.1",
            userAgent: "Test Script",
          },
        },
        { upsert: true, new: true }
      );
      console.log("✅ Updated existing staff activity: kvngdrey8@gmail.com");
    } else {
      console.log("❌ Existing staff not found");
    }

    process.exit(0);
  } catch (error) {
    console.error("Error updating existing staff:", error);
    process.exit(1);
  }
}

updateExistingStaff();
