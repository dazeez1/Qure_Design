import "dotenv/config";
import { connectDatabase } from "../src/config/db.js";
import { User } from "../src/models/User.js";
import { StaffActivity } from "../src/models/StaffActivity.js";
import bcrypt from "bcrypt";

async function createTestStaff() {
  try {
    await connectDatabase(process.env.MONGODB_URI);
    console.log("Connected to database");

    const testStaff = [
      {
        firstName: "Dr. Sarah",
        lastName: "Johnson",
        email: "sarah.johnson@beraclinic.com",
        phone: "555-0101",
        role: "staff",
        hospitalName: "Bera Clinic",
        isEmailVerified: true,
      },
      {
        firstName: "Dr. Michael",
        lastName: "Brown",
        email: "michael.brown@beraclinic.com",
        phone: "555-0102",
        role: "staff",
        hospitalName: "Bera Clinic",
        isEmailVerified: true,
      },
      {
        firstName: "Nurse",
        lastName: "Emily Davis",
        email: "emily.davis@beraclinic.com",
        phone: "555-0103",
        role: "staff",
        hospitalName: "Bera Clinic",
        isEmailVerified: true,
      },
      {
        firstName: "Dr. James",
        lastName: "Wilson",
        email: "james.wilson@beraclinic.com",
        phone: "555-0104",
        role: "staff",
        hospitalName: "Bera Clinic",
        isEmailVerified: true,
      },
    ];

    const password = "1234567890";
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log("\n=== Creating Test Staff for Bera Clinic ===");

    for (const staffData of testStaff) {
      // Check if staff already exists
      const existingStaff = await User.findOne({
        email: staffData.email,
        hospitalName: staffData.hospitalName,
      });

      if (existingStaff) {
        console.log(
          `✅ Staff already exists: ${staffData.firstName} ${staffData.lastName} (${staffData.email})`
        );

        // Create activity record for existing staff
        await StaffActivity.findOneAndUpdate(
          { staff: existingStaff._id, hospitalName: staffData.hospitalName },
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
        console.log(`   📊 Activity record created/updated`);
      } else {
        // Create new staff
        const staffUser = new User({
          ...staffData,
          passwordHash: hashedPassword,
        });

        await staffUser.save();
        console.log(
          `✅ Created new staff: ${staffData.firstName} ${staffData.lastName} (${staffData.email})`
        );

        // Create activity record
        await StaffActivity.create({
          staff: staffUser._id,
          hospitalName: staffData.hospitalName,
          activity: "login",
          isActive: true,
          lastActivityAt: new Date(),
          ipAddress: "127.0.0.1",
          userAgent: "Test Script",
        });
        console.log(`   📊 Activity record created`);
      }
    }

    console.log("\n=== Test Staff Credentials ===");
    console.log("Password for all staff: 1234567890");
    console.log("\nStaff List:");
    testStaff.forEach((staff, index) => {
      console.log(`${index + 1}. ${staff.firstName} ${staff.lastName}`);
      console.log(`   Email: ${staff.email}`);
      console.log(`   Phone: ${staff.phone}`);
      console.log(`   Role: ${staff.role}`);
      console.log("");
    });

    console.log("🎯 Now you can:");
    console.log("1. Login with any of these staff accounts");
    console.log("2. Check Settings2.html to see real-time activity updates");
    console.log("3. Login/logout to see status changes");

    process.exit(0);
  } catch (error) {
    console.error("Error creating test staff:", error);
    process.exit(1);
  }
}

createTestStaff();
