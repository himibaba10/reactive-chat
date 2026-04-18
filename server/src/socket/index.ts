import { Server, Socket } from "socket.io";
import { Message } from "../models/Message";

export interface ServerToClientEvents {
  "message:received": (data: MessagePayload) => void;
  "room:joined": (data: { roomId: string; socketId: string }) => void;
  "room:left": (data: { roomId: string; socketId: string }) => void;
  "history:loaded": (messages: MessagePayload[]) => void;
}

export interface ClientToServerEvents {
  "room:join": (roomId: string) => void;
  "room:leave": (roomId: string) => void;
  "message:send": (data: MessagePayload) => void;
}

export interface MessagePayload {
  roomId: string;
  message: string;
  senderId: string;
  senderName: string;
  timestamp: number;
}

export const registerSocketHandlers = (
  io: Server<ClientToServerEvents, ServerToClientEvents>
): void => {
  io.on("connection", (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
    console.log(`Socket connected: ${socket.id}`);

    // --- ROOM: JOIN ---
    socket.on("room:join", async (roomId) => {
      socket.join(roomId);
      console.log(`${socket.id} joined room: ${roomId}`);

      io.to(roomId).emit("room:joined", { roomId, socketId: socket.id });

      // Load last 50 messages for this room from DB
      try {
        const history = await Message.find({ roomId }).sort({ timestamp: 1 }).limit(50).lean();

        socket.emit("history:loaded", history as MessagePayload[]);
      } catch (err) {
        console.error("Failed to load history:", err);
        socket.emit("history:loaded", []);
      }
    });

    // --- ROOM: LEAVE ---
    socket.on("room:leave", (roomId) => {
      socket.leave(roomId);
      console.log(`${socket.id} left room: ${roomId}`);
      socket.to(roomId).emit("room:left", { roomId, socketId: socket.id });
    });

    // --- MESSAGE: SEND ---
    socket.on("message:send", async (data) => {
      console.log(`Message in room ${data.roomId} from ${data.senderName}: ${data.message}`);

      // 1. Broadcast to room (excluding sender — sender already has it via optimistic update)
      socket.to(data.roomId).emit("message:received", data);

      // 2. Persist to MongoDB — fire and forget pattern.
      // We don't await this before broadcasting — that would slow down real-time delivery.
      // Message reaches other users instantly, DB write happens in background.
      Message.create(data).catch((err) => {
        console.error("Failed to save message:", err);
      });
    });

    // --- DISCONNECT ---
    socket.on("disconnect", (reason) => {
      console.log(`Socket disconnected: ${socket.id} — reason: ${reason}`);
    });
  });
};
