import "dotenv/config";
import { connectDatabase } from "../src/config/db.js";
import { User } from "../src/models/User.js";
import { Appointment } from "../src/models/Appointment.js";

async function createMoreAppointments() {
  try {
    await connectDatabase(process.env.MONGODB_URI);
    console.log("Connected to database");

    // Find multiple patient users
    const patients = await User.find({ role: "patient" }).limit(5);
    if (patients.length === 0) {
      console.log("No patients found in database");
      return;
    }

    console.log(`Found ${patients.length} patients`);

    const appointments = [
      {
        doctor: "Dr. General Practitioner",
        specialty: "Cardiology",
        appointmentDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
        appointmentTime: "09:00",
        notes: "Cardiology consultation",
        hospitalName: "Bera Clinic",
      },
      {
        doctor: "Dr. General Practitioner",
        specialty: "Dermatology",
        appointmentDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        appointmentTime: "14:00",
        notes: "Skin check-up",
        hospitalName: "Bera Clinic",
      },
      {
        doctor: "Dr. General Practitioner",
        specialty: "Pediatrics",
        appointmentDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
        appointmentTime: "11:30",
        notes: "Child wellness check",
        hospitalName: "Bera Clinic",
      },
      {
        doctor: "Dr. General Practitioner",
        specialty: "Orthopedics",
        appointmentDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        appointmentTime: "15:30",
        notes: "Knee pain consultation",
        hospitalName: "Bera Clinic",
      },
    ];

    for (let i = 0; i < appointments.length && i < patients.length; i++) {
      const patient = patients[i];
      const appointmentData = appointments[i];

      const appointment = new Appointment({
        ...appointmentData,
        patient: patient._id,
        patientInfo: {
          fullName: `${patient.firstName} ${patient.lastName}`,
          phoneNumber: patient.phone || "1234567890",
          gender: "prefer-not-to-say",
          dateOfBirth: new Date("1990-01-01"),
        },
      });

      await appointment.save();

      // Update patient's preferred hospital
      await User.findByIdAndUpdate(patient._id, {
        $set: { preferredHospital: "Bera Clinic" },
      });

      console.log(
        `✅ Appointment ${i + 1} created for ${patient.firstName} ${
          patient.lastName
        }`
      );
      console.log(`   Specialty: ${appointmentData.specialty}`);
      console.log(`   Date: ${appointmentData.appointmentDate.toDateString()}`);
      console.log(`   Time: ${appointmentData.appointmentTime}`);
    }

    console.log(
      `\n🎉 Created ${appointments.length} appointments for Bera Clinic!`
    );
    process.exit(0);
  } catch (error) {
    console.error("Error creating appointments:", error);
    process.exit(1);
  }
}

createMoreAppointments();
