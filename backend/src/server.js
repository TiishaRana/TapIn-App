import express from "express";
import dotenv from "dotenv";
dotenv.config();
console.log("JWT present?", !!(process.env.JWT_SECRET || process.env.JWT_SECRET_KEY));
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";

import userRoutes from "./routes/user.route.js";
import authRoutes from "./routes/auth.route.js";
import chatRoutes from "./routes/chat.route.js";

import { connectDB } from "./lib/db.js";

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.NODE_ENV === "production" ? process.env.FRONTEND_URL : "http://localhost:5173",
    credentials: true,
  },
});

const PORT = process.env.PORT || 5050;

const __dirname = path.resolve();

app.use(
  cors({
    origin: process.env.NODE_ENV === "production" ? process.env.FRONTEND_URL : "http://localhost:5173",
    credentials: true, // allow frontend to send cookies
  })
);

app.use(express.json());
app.use(cookieParser());

// Serve static files for uploaded images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/auth", authRoutes);

// Expose io to routes/controllers
app.set("io", io);

// Minimal Socket.io handlers
io.on("connection", (socket) => {
  // Join a conversation room to receive real-time messages
  socket.on("join_conversation", (conversationId) => {
    if (conversationId) socket.join(`conversation:${conversationId}`);
  });

  // Optional typing indicator relay
  socket.on("typing", ({ conversationId, userId }) => {
    if (conversationId) {
      socket.to(`conversation:${conversationId}`).emit("typing", { conversationId, userId });
    }
  });

  socket.on("disconnect", () => {
    // no-op for now
  });
});

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDB();
});
