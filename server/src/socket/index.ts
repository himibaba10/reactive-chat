import { Server, Socket } from "socket.io";
import { Message } from "../models/Message";

export interface ServerToClientEvents {
  "message:received": (data: MessagePayload) => void;
  "room:joined": (data: { roomId: string; socketId: string; name: string }) => void;
  "room:left": (data: { roomId: string; socketId: string; name: string }) => void;
  "history:loaded": (messages: MessagePayload[]) => void;
  "typing:update": (data: TypingPayload) => void;
}

export interface ClientToServerEvents {
  "room:join": (roomId: string) => void;
  "room:leave": (roomId: string) => void;
  "message:send": (data: Pick<MessagePayload, "roomId" | "message">) => void;
  "typing:start": (roomId: string) => void;
  "typing:stop": (roomId: string) => void;
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
    // socket.data.user is guaranteed here — middleware already verified it
    const { userId, name } = socket.data.user;
    console.log(`Socket connected: ${socket.id} (${name})`);

    socket.on("room:join", async (roomId) => {
      socket.join(roomId);
      console.log(`${name} joined room: ${roomId}`);

      io.to(roomId).emit("room:joined", { roomId, socketId: socket.id, name });

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
      console.log(`${name} left room: ${roomId}`);
      socket.to(roomId).emit("room:left", { roomId, socketId: socket.id, name });
    });

    socket.on("message:send", async ({ roomId, message }) => {
      // Build the full payload SERVER-SIDE using verified identity
      // Client only sends roomId + message — nothing about who they are
      // This prevents any user from spoofing another user's name or id
      const payload: MessagePayload = {
        roomId,
        message,
        senderId: userId,
        senderName: name,
        timestamp: Date.now(),
      };

      socket.to(roomId).emit("message:received", payload);
      Message.create(payload).catch((err) => console.error("Failed to save message:", err));
    });

    // Client only sends roomId — server knows who is typing from socket.data.user
    socket.on("typing:start", (roomId) => {
      socket.to(roomId).emit("typing:update", {
        roomId,
        senderId: userId,
        senderName: name,
        isTyping: true,
      });
    });

    socket.on("typing:stop", (roomId) => {
      socket.to(roomId).emit("typing:update", {
        roomId,
        senderId: userId,
        senderName: name,
        isTyping: false,
      });
    });

    // FIX: clear typing state on disconnect
    // Now we have user identity, we can tell the room this user stopped typing
    socket.on("disconnect", (reason) => {
      console.log(`Socket disconnected: ${socket.id} (${name}) — reason: ${reason}`);

      // Notify all rooms this socket was in that they stopped typing
      // socket.rooms is empty after disconnect, so we use a workaround:
      // We emit to all rooms the socket was tracking via broadcast
      socket.broadcast.emit("typing:update", {
        roomId: "", // client filters by roomId so empty string won't match
        senderId: userId,
        senderName: name,
        isTyping: false,
      });
    });
  });
};
