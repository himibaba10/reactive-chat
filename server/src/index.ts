import express from "express";
import cors from "cors";
import morgan from "morgan";
import { createServer } from "http";
import { Server } from "socket.io";
import connectDB from "./config/db";

const app = express();

// KEY CONCEPT: Socket.IO needs a raw HTTP server, not just Express.
// Express alone handles HTTP. Socket.IO wraps that same server to also
// handle WebSocket upgrades on the same port.
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000", // Next.js dev server
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 5000;

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
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

export { io }; // export so other files can emit events later
