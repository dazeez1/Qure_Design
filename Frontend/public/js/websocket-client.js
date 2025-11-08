/**
 * Socket.IO Client for Real-time Updates
 * Handles Socket.IO connections and real-time data updates
 */

class SocketClient {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.eventHandlers = new Map();
    this.authToken = localStorage.getItem("authToken");
  }

  // Initialize Socket.IO connection
  connect() {
    if (this.socket && this.isConnected) {
      console.log("Socket.IO already connected");
      return;
    }

    const socketUrl =
      window.location.hostname === "localhost"
        ? "http://localhost:10000"
        : "https://qure-design.onrender.com";

    try {
      if (typeof io === "undefined") {
        console.error(
          "Socket.IO library not loaded. Please include socket.io.min.js"
        );
        return;
      }
      this.initializeSocket(socketUrl);
    } catch (error) {
      console.error("Failed to create Socket.IO connection:", error);
    }
  }

  // Initialize Socket.IO connection
  initializeSocket(socketUrl) {
    this.socket = io(socketUrl, {
      auth: {
        token: this.authToken,
      },
      transports: ["websocket", "polling"],
    });

    this.socket.on("connect", this.handleConnect.bind(this));
    this.socket.on("disconnect", this.handleDisconnect.bind(this));
    this.socket.on("connect_error", this.handleError.bind(this));

    // Handle specific events
    this.socket.on("queue-update", (data) => this.emit("queueUpdate", data));
    this.socket.on("waiting-room-update", (data) =>
      this.emit("waitingRoomUpdate", data)
    );
    this.socket.on("appointment-update", (data) =>
      this.emit("appointmentUpdate", data)
    );
    this.socket.on("notification", (data) => this.emit("notification", data));
    this.socket.on("announcement", (data) => this.emit("announcement", data));

    console.log("Socket.IO connection initiated");
  }

  // Handle Socket.IO connection
  handleConnect() {
    console.log("Socket.IO connected");
    this.isConnected = true;
    this.reconnectAttempts = 0;

    // Emit connection event
    this.emit("connected", { timestamp: new Date() });
  }

  // Handle Socket.IO disconnection
  handleDisconnect(reason) {
    console.log("Socket.IO disconnected:", reason);
    this.isConnected = false;

    this.emit("disconnected", {
      reason: reason,
      timestamp: new Date(),
    });

    // Attempt to reconnect if not a normal closure
    if (reason !== "io client disconnect") {
      this.scheduleReconnect();
    }
  }

  // Handle Socket.IO errors
  handleError(error) {
    console.error("Socket.IO error:", error);
    this.emit("error", error);
  }

  // Send data through Socket.IO
  emitSocketEvent(event, data) {
    if (this.socket && this.isConnected) {
      try {
        this.socket.emit(event, data);
      } catch (error) {
        console.error("Error emitting Socket.IO event:", error);
      }
    } else {
      console.warn("Socket.IO not connected, cannot emit event");
    }
  }

  // Subscribe to events
  on(eventName, handler) {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, []);
    }
    this.eventHandlers.get(eventName).push(handler);
  }

  // Unsubscribe from events
  off(eventName, handler) {
    if (this.eventHandlers.has(eventName)) {
      const handlers = this.eventHandlers.get(eventName);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  // Emit events to registered handlers
  emit(eventName, data) {
    if (this.eventHandlers.has(eventName)) {
      this.eventHandlers.get(eventName).forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${eventName}:`, error);
        }
      });
    }
  }

  // Schedule reconnection attempt
  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log("Max reconnection attempts reached");
      this.emit("maxReconnectAttemptsReached", {
        attempts: this.reconnectAttempts,
      });
      return;
    }

    this.reconnectAttempts++;
    console.log(
      `Scheduling reconnection attempt ${this.reconnectAttempts} in ${this.reconnectInterval}ms`
    );

    setTimeout(() => {
      console.log(`Reconnection attempt ${this.reconnectAttempts}`);
      this.connect();
    }, this.reconnectInterval);
  }

  // Join a specific room
  joinRoom(roomId) {
    this.emitSocketEvent("join-room", { roomId: roomId });
  }

  // Leave a specific room
  leaveRoom(roomId) {
    this.emitSocketEvent("leave-room", { roomId: roomId });
  }

  // Disconnect Socket.IO
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Update authentication token
  updateAuthToken(token) {
    this.authToken = token;
    // Socket.IO handles auth automatically on connection
    // If already connected, we would need to reconnect with new token
    if (this.isConnected) {
      this.disconnect();
      this.connect();
    }
  }

  // Get connection status
  getStatus() {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
    };
  }
}

// Create global instance
window.socketClient = new SocketClient();

// Auto-connect when auth token is available
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("authToken");
  if (token) {
    window.socketClient.connect();
  }
});

// Export for module usage
if (typeof module !== "undefined" && module.exports) {
  module.exports = SocketClient;
}
