import mongoose from "mongoose";

export async function connectDatabase(mongoUri) {
  if (!mongoUri) {
    throw new Error(
      "MONGODB_URI is missing. Please set it in your environment."
    );
  }
  mongoose.set("strictQuery", true);
  await mongoose.connect(mongoUri, {
    autoIndex: true,
  });
  return mongoose.connection;
}
