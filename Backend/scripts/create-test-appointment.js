import "dotenv/config";
import { connectDatabase } from "../src/config/db.js";
import { User } from "../src/models/User.js";
import { Appointment } from "../src/models/Appointment.js";

async function createTestAppointment() {
  try {
    await connectDatabase(process.env.MONGODB_URI);
    console.log("Connected to database");

    // Find a patient user
    const patient = await User.findOne({ role: "patient" });
    if (!patient) {
      console.log("No patient found in database");
      return;
    }

    console.log("Found patient:", patient.email);

    // Create a test appointment for Bera Clinic
    const appointmentData = {
      doctor: "Dr. General Practitioner",
      specialty: "General Medicine",
      appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      appointmentTime: "10:00",
      notes: "Test appointment for Bera Clinic",
      hospitalName: "Bera Clinic",
      patient: patient._id,
      patientInfo: {
        fullName: `${patient.firstName} ${patient.lastName}`,
        phoneNumber: patient.phone || "1234567890",
        gender: "prefer-not-to-say",
        dateOfBirth: new Date("1990-01-01"),
      },
    };

    const appointment = new Appointment(appointmentData);
    await appointment.save();

    console.log("✅ Test appointment created successfully!");
    console.log("Appointment ID:", appointment._id);
    console.log("Patient:", appointment.patientInfo.fullName);
    console.log("Hospital:", appointment.hospitalName);
    console.log("Date:", appointment.appointmentDate);
    console.log("Time:", appointment.appointmentTime);

    // Update patient's preferred hospital
    await User.findByIdAndUpdate(patient._id, {
      $set: { preferredHospital: "Bera Clinic" },
    });

    console.log("✅ Patient's preferred hospital updated to Bera Clinic");

    process.exit(0);
  } catch (error) {
    console.error("Error creating test appointment:", error);
    process.exit(1);
  }
}

createTestAppointment();
