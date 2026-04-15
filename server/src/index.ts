import cors from "cors";
import express from "express";
import { createServer } from "http";
import morgan from "morgan";
import { Server } from "socket.io";
import { config } from "./config";
import connectDB from "./config/db";

const app = express();
const httpServer = createServer(app);

export const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (_req, res) => {
  res.json({ message: "Server is running" });
});

// Socket.IO connection lifecycle
io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on("disconnect", (reason) => {
    console.log(`Socket disconnected: ${socket.id} — reason: ${reason}`);
  });
});

connectDB().then(() => {
  // Listen on httpServer, NOT app — this is important
  httpServer.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
  });
});
