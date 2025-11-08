import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../src/models/User.js";
import { Queue } from "../src/models/Queue.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI is missing. Please set it in your environment.");
  process.exit(1);
}

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
}

async function populateBeraQueue() {
  try {
    await connectDB();

    // Find 5 patients who have Bera Clinic as their preferred hospital
    const patients = await User.find({
      role: "patient",
      preferredHospital: "Bera Clinic",
    }).limit(5);

    console.log(
      `Found ${patients.length} patients with Bera Clinic preference`
    );

    if (patients.length === 0) {
      console.log(
        "No patients found with Bera Clinic preference. Creating some..."
      );

      // Find any 5 patients and update their preferred hospital to Bera Clinic
      const anyPatients = await User.find({ role: "patient" }).limit(5);

      for (const patient of anyPatients) {
        patient.preferredHospital = "Bera Clinic";
        await patient.save();
        console.log(
          `Updated ${patient.firstName} ${patient.lastName} to prefer Bera Clinic`
        );
      }

      // Re-fetch the updated patients
      const updatedPatients = await User.find({
        role: "patient",
        preferredHospital: "Bera Clinic",
      }).limit(5);

      patients.push(...updatedPatients);
    }

    // Clear any existing queues for these patients
    await Queue.deleteMany({
      patient: { $in: patients.map((p) => p._id) },
      status: { $in: ["waiting", "called"] },
    });

    // Create queue entries for each patient
    const specialties = [
      "General Medicine",
      "Cardiology",
      "Dermatology",
      "Pediatrics",
      "Orthopedics",
    ];
    const queueEntries = [];

    for (let i = 0; i < patients.length; i++) {
      const patient = patients[i];
      const specialty = specialties[i % specialties.length];

      // Get the next queue number for this hospital and specialty
      const lastQueue = await Queue.findOne({
        hospitalName: "Bera Clinic",
        specialty: specialty,
      }).sort({ queueNumber: -1 });

      const nextQueueNumber = lastQueue ? lastQueue.queueNumber + 1 : 1;

      const queueEntry = new Queue({
        patient: patient._id,
        hospitalName: "Bera Clinic",
        specialty: specialty,
        queueNumber: nextQueueNumber,
        position: i + 1,
        status: "waiting",
        estimatedWaitTime: (i + 1) * 15, // 15 minutes per position
        joinedAt: new Date(Date.now() - i * 5 * 60 * 1000), // Stagger join times by 5 minutes
      });

      await queueEntry.save();
      queueEntries.push(queueEntry);

      console.log(
        `✅ Added ${patient.firstName} ${
          patient.lastName
        } to Bera Clinic ${specialty} queue (Position ${
          i + 1
        }, Queue #${nextQueueNumber})`
      );
    }

    console.log(
      `\n🎉 Successfully populated Bera Clinic queue with ${queueEntries.length} patients!`
    );

    // Display the queue
    console.log("\n📋 Current Bera Clinic Queue:");
    console.log("================================");
    for (const entry of queueEntries) {
      const patient = await User.findById(entry.patient);
      console.log(
        `Position ${entry.position}: ${patient.firstName} ${patient.lastName} - ${entry.specialty} (Queue #${entry.queueNumber}) - ${entry.status}`
      );
    }
  } catch (error) {
    console.error("Error populating Bera queue:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  }
}

populateBeraQueue();
