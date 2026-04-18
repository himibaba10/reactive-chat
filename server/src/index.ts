import cors from "cors";
import express from "express";
import { createServer } from "http";
import morgan from "morgan";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { config } from "./config";
import { pubClient, subClient, connectRedis } from "./config/redis";
import connectDB from "./config/db";
import authRoutes from "./routes/auth.routes";
import { socketAuthMiddleware } from "./middleware/socketAuth";
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

app.use("/auth", authRoutes);

io.use(socketAuthMiddleware);
registerSocketHandlers(io);

const bootstrap = async (): Promise<void> => {
  // Try Redis — attach adapter only if available
  const redisConnected = await connectRedis();
  if (redisConnected) {
    io.adapter(createAdapter(pubClient, subClient));
    console.log("Socket.IO using Redis adapter");
  }

  await connectDB();

  httpServer.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
  });
};

bootstrap();
