import express from "express";
import { Hospital } from "../models/Hospital.js";

const router = express.Router();

// Public list of active hospitals (for booking dropdown)
router.get("/", async (_req, res) => {
  try {
    const hospitals = await Hospital.find({ isActive: true })
      .select("name code")
      .sort({ name: 1 })
      .lean();
    res.json({ success: true, data: hospitals });
  } catch (e) {
    res
      .status(500)
      .json({ success: false, message: "Failed to load hospitals" });
  }
});

export { router as hospitalRouter };
