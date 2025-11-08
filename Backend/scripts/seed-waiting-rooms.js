import mongoose from "mongoose";
import dotenv from "dotenv";
import { WaitingRoom } from "../src/models/WaitingRoom.js";

dotenv.config();

async function seedWaitingRooms() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Clear existing waiting rooms
    await WaitingRoom.deleteMany({});
    console.log("Cleared existing waiting rooms");

    // Define waiting rooms for different hospitals
    const waitingRooms = [
      // Bera Clinic
      {
        name: "Waiting Room A",
        description: "Main Hall",
        hospitalName: "Bera Clinic",
        floor: "Ground Floor",
        capacity: 25,
        specialties: ["General Medicine", "Cardiology"],
        color: "yellow",
      },
      {
        name: "Waiting Room B",
        description: "Pediatrics Lobby",
        hospitalName: "Bera Clinic",
        floor: "1st Floor",
        capacity: 15,
        specialties: ["Pediatrics"],
        color: "green",
      },
      {
        name: "Waiting Room C",
        description: "Lab Sample Area",
        hospitalName: "Bera Clinic",
        floor: "Ground Floor",
        capacity: 12,
        specialties: ["Laboratory", "Diagnostics"],
        color: "orange",
      },
      {
        name: "Waiting Room D",
        description: "X-Ray Waiting",
        hospitalName: "Bera Clinic",
        floor: "Ground Floor",
        capacity: 22,
        specialties: ["Radiology", "Imaging"],
        color: "red",
      },
      {
        name: "Waiting Room E",
        description: "General OPD",
        hospitalName: "Bera Clinic",
        floor: "1st Floor",
        capacity: 20,
        specialties: ["General Medicine", "Dermatology"],
        color: "yellow",
      },
      {
        name: "Waiting Room F",
        description: "Emergency Hall",
        hospitalName: "Bera Clinic",
        floor: "Ground Floor",
        capacity: 10,
        specialties: ["Emergency Medicine"],
        color: "green",
      },

      // Other hospitals
      {
        name: "Main Waiting Area",
        description: "Central Reception",
        hospitalName: "City General Hospital",
        floor: "Ground Floor",
        capacity: 30,
        specialties: ["General Medicine", "Cardiology", "Neurology"],
        color: "green",
      },
      {
        name: "Specialist Clinic",
        description: "Specialist Consultation",
        hospitalName: "City General Hospital",
        floor: "2nd Floor",
        capacity: 18,
        specialties: ["Oncology", "Endocrinology", "Gastroenterology"],
        color: "yellow",
      },
      {
        name: "Emergency Department",
        description: "Emergency Care",
        hospitalName: "City General Hospital",
        floor: "Ground Floor",
        capacity: 15,
        specialties: ["Emergency Medicine", "Trauma"],
        color: "red",
      },
      {
        name: "Maternity Ward",
        description: "Prenatal Care",
        hospitalName: "City General Hospital",
        floor: "3rd Floor",
        capacity: 12,
        specialties: ["Obstetrics", "Gynecology"],
        color: "green",
      },
    ];

    // Create waiting rooms
    const createdRooms = await WaitingRoom.insertMany(waitingRooms);
    console.log(`Created ${createdRooms.length} waiting rooms`);

    // Display created rooms
    console.log("\nCreated waiting rooms:");
    createdRooms.forEach((room) => {
      console.log(
        `- ${room.name} (${room.hospitalName}) - ${
          room.capacity
        } capacity - ${room.specialties.join(", ")}`
      );
    });

    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  } catch (error) {
    console.error("Error seeding waiting rooms:", error);
    process.exit(1);
  }
}

seedWaitingRooms();
