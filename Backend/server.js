import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { createServer } from "http";
import { router as apiRouter } from "./src/routes/index.js";
import { connectDatabase } from "./src/config/db.js";
import { setupAppointmentReminderCron } from "./src/controllers/notificationSettingsController.js";
import { webSocketService } from "./src/services/websocket.js";

const app = express();
const server = createServer(app);

app.use(helmet());
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",")
  : undefined;
app.use(cors({ origin: corsOrigins || "*" }));
app.use(express.json());
app.use(morgan("dev"));

app.use("/api", apiRouter);

app.get("/health", (_req, res) => res.json({ status: "ok" }));

const port = process.env.PORT || 4000;
async function start() {
  try {
    await connectDatabase(process.env.MONGODB_URI);

    // Initialize WebSocket service
    webSocketService.initialize(server);

    // Setup appointment reminder cron job
    setupAppointmentReminderCron();

    server.listen(port, () => {
      console.log(`API listening on port ${port}`);
      console.log(`WebSocket server ready for connections`);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
}

start();
