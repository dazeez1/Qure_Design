import "dotenv/config";
import { connectDatabase } from "../src/config/db.js";
import { User } from "../src/models/User.js";
import { Appointment } from "../src/models/Appointment.js";

async function debugAppointments() {
  try {
    await connectDatabase(process.env.MONGODB_URI);
    console.log("Connected to database");

    // Check all appointments
    const allAppointments = await Appointment.find({});
    console.log(
      `\n📊 Total appointments in database: ${allAppointments.length}`
    );

    if (allAppointments.length > 0) {
      console.log("\n📋 All appointments:");
      allAppointments.forEach((apt, index) => {
        console.log(
          `${index + 1}. Patient: ${apt.patientInfo?.fullName || "Unknown"}`
        );
        console.log(`   Hospital: ${apt.hospitalName || "No hospital"}`);
        console.log(`   Specialty: ${apt.specialty || "No specialty"}`);
        console.log(`   Date: ${apt.appointmentDate}`);
        console.log(`   Status: ${apt.status || "No status"}`);
        console.log(`   ID: ${apt._id}`);
        console.log("");
      });
    }

    // Check appointments for Bera Clinic specifically
    const beraAppointments = await Appointment.find({
      hospitalName: "Bera Clinic",
    });
    console.log(`\n🏥 Bera Clinic appointments: ${beraAppointments.length}`);

    if (beraAppointments.length > 0) {
      console.log("\n📋 Bera Clinic appointments:");
      beraAppointments.forEach((apt, index) => {
        console.log(
          `${index + 1}. Patient: ${apt.patientInfo?.fullName || "Unknown"}`
        );
        console.log(`   Specialty: ${apt.specialty || "No specialty"}`);
        console.log(`   Date: ${apt.appointmentDate}`);
        console.log(`   Status: ${apt.status || "No status"}`);
        console.log("");
      });
    }

    // Check staff users
    const staffUsers = await User.find({ role: "staff" });
    console.log(`\n👨‍⚕️ Staff users: ${staffUsers.length}`);

    staffUsers.forEach((staff, index) => {
      console.log(`${index + 1}. Name: ${staff.firstName} ${staff.lastName}`);
      console.log(`   Email: ${staff.email}`);
      console.log(`   Hospital: ${staff.hospitalName || "No hospital"}`);
      console.log(`   ID: ${staff._id}`);
      console.log("");
    });

    // Check if there are any appointments without hospitalName
    const appointmentsWithoutHospital = await Appointment.find({
      hospitalName: { $exists: false },
    });
    console.log(
      `\n❌ Appointments without hospitalName: ${appointmentsWithoutHospital.length}`
    );

    if (appointmentsWithoutHospital.length > 0) {
      console.log("\n📋 Appointments without hospital:");
      appointmentsWithoutHospital.forEach((apt, index) => {
        console.log(
          `${index + 1}. Patient: ${apt.patientInfo?.fullName || "Unknown"}`
        );
        console.log(`   ID: ${apt._id}`);
        console.log("");
      });
    }

    process.exit(0);
  } catch (error) {
    console.error("Error debugging appointments:", error);
    process.exit(1);
  }
}

debugAppointments();
