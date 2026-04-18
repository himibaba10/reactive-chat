import { Server, Socket } from "socket.io";
import { Message } from "../models/Message";

export interface ServerToClientEvents {
  "message:received": (data: MessagePayload) => void;
  "room:joined": (data: { roomId: string; socketId: string }) => void;
  "room:left": (data: { roomId: string; socketId: string }) => void;
  "history:loaded": (messages: MessagePayload[]) => void;
  "typing:update": (data: TypingPayload) => void; // NEW
}

export interface ClientToServerEvents {
  "room:join": (roomId: string) => void;
  "room:leave": (roomId: string) => void;
  "message:send": (data: MessagePayload) => void;
  "typing:start": (data: TypingPayload) => void; // NEW
  "typing:stop": (data: TypingPayload) => void; // NEW
}

export interface MessagePayload {
  roomId: string;
  message: string;
  senderId: string;
  senderName: string;
  timestamp: number;
}

export interface TypingPayload {
  roomId: string;
  senderId: string;
  senderName: string;
  isTyping: boolean;
}

export const registerSocketHandlers = (
  io: Server<ClientToServerEvents, ServerToClientEvents>
): void => {
  io.on("connection", (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on("room:join", async (roomId) => {
      socket.join(roomId);
      console.log(`${socket.id} joined room: ${roomId}`);
      io.to(roomId).emit("room:joined", { roomId, socketId: socket.id });

      try {
        const history = await Message.find({ roomId }).sort({ timestamp: 1 }).limit(50).lean();
        socket.emit("history:loaded", history as MessagePayload[]);
      } catch (err) {
        console.error("Failed to load history:", err);
        socket.emit("history:loaded", []);
      }
    });

    socket.on("room:leave", (roomId) => {
      socket.leave(roomId);
      console.log(`${socket.id} left room: ${roomId}`);
      socket.to(roomId).emit("room:left", { roomId, socketId: socket.id });
    });

    socket.on("message:send", async (data) => {
      socket.to(data.roomId).emit("message:received", data);
      Message.create(data).catch((err) => console.error("Failed to save message:", err));
    });

    // --- TYPING: START ---
    // Server just relays this to everyone in the room except the typer.
    // No DB, no logic — pure relay. Stateless on the server.
    socket.on("typing:start", (data) => {
      socket.to(data.roomId).emit("typing:update", { ...data, isTyping: true });
    });

    // --- TYPING: STOP ---
    socket.on("typing:stop", (data) => {
      socket.to(data.roomId).emit("typing:update", { ...data, isTyping: false });
    });

    // --- DISCONNECT ---
    // KEY: if a socket disconnects while typing, we must clear their typing state.
    // Otherwise other users see "X is typing..." forever.
    socket.on("disconnect", (reason) => {
      console.log(`Socket disconnected: ${socket.id} — reason: ${reason}`);
    });
  });
};
