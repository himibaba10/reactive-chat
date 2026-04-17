import cors from "cors";
import express from "express";
import { createServer } from "http";
import morgan from "morgan";
import { Server } from "socket.io";
import { config } from "./config";
import connectDB from "./config/db";
import { registerSocketHandlers, ClientToServerEvents, ServerToClientEvents } from "./socket";

const app = express();
const httpServer = createServer(app);

export const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
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

// All socket logic lives in socket/index.ts — not here
registerSocketHandlers(io);

connectDB().then(() => {
  httpServer.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
  });
});
