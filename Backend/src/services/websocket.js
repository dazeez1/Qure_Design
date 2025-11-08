import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

class WebSocketService {
  constructor() {
    this.io = null;
    this.connectedClients = new Map(); // Map of userId to socketId
    this.hospitalRooms = new Map(); // Map of hospitalName to Set of socketIds
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.CORS_ORIGIN
          ? process.env.CORS_ORIGIN.split(",")
          : "*",
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    this.io.use(this.authenticateSocket.bind(this));
    this.io.on("connection", this.handleConnection.bind(this));

    console.log("WebSocket service initialized");
  }

  async authenticateSocket(socket, next) {
    try {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        return next(new Error("Authentication token required"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // Handle both 'id' and 'userId' fields in JWT token
      const userId = decoded.id || decoded.userId;
      const user = await User.findById(userId).select("_id role hospitalName");

      if (!user) {
        return next(new Error("User not found"));
      }

      socket.userId = user._id.toString();
      socket.userRole = user.role;
      socket.hospitalName = user.hospitalName;

      next();
    } catch (error) {
      console.error("Socket authentication error:", error);
      next(new Error("Authentication failed"));
    }
  }

  handleConnection(socket) {
    console.log(`User ${socket.userId} connected with role ${socket.userRole}`);

    // Store client connection
    this.connectedClients.set(socket.userId, socket.id);

    // Join hospital-specific room
    if (socket.hospitalName) {
      socket.join(`hospital:${socket.hospitalName}`);
      if (!this.hospitalRooms.has(socket.hospitalName)) {
        this.hospitalRooms.set(socket.hospitalName, new Set());
      }
      this.hospitalRooms.get(socket.hospitalName).add(socket.id);
    }

    // Handle specific events
    socket.on("join-room", (data) => {
      const { roomId } = data;
      socket.join(`room:${roomId}`);
      console.log(`User ${socket.userId} joined room ${roomId}`);
    });

    socket.on("leave-room", (data) => {
      const { roomId } = data;
      socket.leave(`room:${roomId}`);
      console.log(`User ${socket.userId} left room ${roomId}`);
    });

    socket.on("disconnect", () => {
      console.log(`User ${socket.userId} disconnected`);
      this.connectedClients.delete(socket.userId);

      if (socket.hospitalName && this.hospitalRooms.has(socket.hospitalName)) {
        this.hospitalRooms.get(socket.hospitalName).delete(socket.id);
      }
    });
  }

  // Broadcast queue updates to hospital staff
  broadcastQueueUpdate(hospitalName, updateData) {
    if (this.io) {
      this.io.to(`hospital:${hospitalName}`).emit("queue-update", updateData);
      console.log(`Broadcasted queue update to hospital: ${hospitalName}`);
    }
  }

  // Broadcast waiting room updates
  broadcastWaitingRoomUpdate(hospitalName, roomId, updateData) {
    if (this.io) {
      this.io.to(`hospital:${hospitalName}`).emit("waiting-room-update", {
        roomId,
        ...updateData,
      });
      this.io.to(`room:${roomId}`).emit("waiting-room-update", {
        roomId,
        ...updateData,
      });
      console.log(`Broadcasted waiting room update for room: ${roomId}`);
    }
  }

  // Broadcast appointment updates
  broadcastAppointmentUpdate(hospitalName, updateData) {
    if (this.io) {
      this.io
        .to(`hospital:${hospitalName}`)
        .emit("appointment-update", updateData);
      console.log(
        `Broadcasted appointment update to hospital: ${hospitalName}`
      );
    }
  }

  // Broadcast notification to specific user
  sendNotificationToUser(userId, notificationData) {
    if (this.io && this.connectedClients.has(userId)) {
      const socketId = this.connectedClients.get(userId);
      this.io.to(socketId).emit("notification", notificationData);
      console.log(`Sent notification to user: ${userId}`);
    }
  }

  // Broadcast announcement to hospital
  broadcastAnnouncement(hospitalName, announcementData) {
    if (this.io) {
      this.io
        .to(`hospital:${hospitalName}`)
        .emit("announcement", announcementData);
      console.log(`Broadcasted announcement to hospital: ${hospitalName}`);
    }
  }

  // Get connected clients count for a hospital
  getHospitalClientCount(hospitalName) {
    if (this.hospitalRooms.has(hospitalName)) {
      return this.hospitalRooms.get(hospitalName).size;
    }
    return 0;
  }

  // Get all connected clients count
  getTotalClientCount() {
    return this.connectedClients.size;
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService();
export default webSocketService;
