import { Server, Socket } from "socket.io";
import { Message } from "../models/Message";
import { User } from "../models/User";
import {
  addUserToRoom,
  removeUserFromRoom,
  getOnlineUsers,
  trackSocketRoom,
  getSocketRooms,
  clearSocketRooms,
  OnlineUser,
} from "./presence";

export interface ServerToClientEvents {
  "message:received": (data: MessagePayload) => void;
  "room:joined": (data: { roomId: string; socketId: string; name: string }) => void;
  "room:left": (data: { roomId: string; socketId: string; name: string }) => void;
  "history:loaded": (messages: MessagePayload[]) => void;
  "history:error": (message: string) => void;
  "typing:update": (data: TypingPayload) => void;
  "presence:update": (data: PresencePayload) => void; // NEW
}

export interface ClientToServerEvents {
  "room:join": (roomId: string) => void;
  "room:leave": (roomId: string) => void;
  // NEW: acknowledgement pattern — callback is the 2nd arg
  // Server calls it to confirm receipt. Client knows message was delivered.
  "message:send": (
    data: Pick<MessagePayload, "roomId" | "message">,
    ack: (response: AckResponse) => void
  ) => void;
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

export interface PresencePayload {
  roomId: string;
  onlineUsers: OnlineUser[];
}

// Acknowledgement response shape — server tells client: success or fail
export interface AckResponse {
  ok: boolean;
  error?: string;
}

export const registerSocketHandlers = (
  io: Server<ClientToServerEvents, ServerToClientEvents>
): void => {
  io.on("connection", (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
    const { userId, name } = socket.data.user;
    console.log(`Socket connected: ${socket.id} (${name})`);

    // Mark user online — set lastSeen to null (convention: null = online)
    User.findByIdAndUpdate(userId, { lastSeen: null }).catch(console.error);

    // --- ROOM: JOIN ---
    socket.on("room:join", async (roomId) => {
      socket.join(roomId);

      // Track presence
      const user: OnlineUser = { userId, name, socketId: socket.id };
      addUserToRoom(roomId, user);
      trackSocketRoom(socket.id, roomId);

      console.log(`${name} joined room: ${roomId}`);
      io.to(roomId).emit("room:joined", { roomId, socketId: socket.id, name });

      // Broadcast updated presence list to everyone in the room
      // KEY: io.to(roomId) — everyone including the joiner needs to see the full list
      io.to(roomId).emit("presence:update", {
        roomId,
        onlineUsers: getOnlineUsers(roomId),
      });

      try {
        const history = await Message.find({ roomId }).sort({ timestamp: 1 }).limit(50).lean();
        socket.emit("history:loaded", history as MessagePayload[]);
      } catch (err) {
        console.error("Failed to load history:", err);
        const errMsg = err instanceof Error ? err.message : String(err);
        socket.emit("history:error", errMsg);
        socket.emit("history:loaded", []);
      }
    });

    // --- ROOM: LEAVE ---
    socket.on("room:leave", (roomId) => {
      socket.leave(roomId);
      removeUserFromRoom(roomId, userId);

      console.log(`${name} left room: ${roomId}`);
      socket.to(roomId).emit("room:left", { roomId, socketId: socket.id, name });

      // Broadcast updated presence list — user is now gone
      socket.to(roomId).emit("presence:update", {
        roomId,
        onlineUsers: getOnlineUsers(roomId),
      });
    });

    // --- MESSAGE: SEND (with acknowledgement) ---
    socket.on("message:send", async ({ roomId, message }, ack) => {
      try {
        const payload: MessagePayload = {
          roomId,
          message,
          senderId: userId,
          senderName: name,
          timestamp: Date.now(),
        };

        socket.to(roomId).emit("message:received", payload);

        // Save to DB — we await this before acking so we confirm persistence
        await Message.create(payload);

        // Tell the client: message was saved successfully
        // Client can now show a "delivered" tick instead of pending state
        ack({ ok: true });
      } catch (err) {
        console.error("Failed to save message:", err);
        // Tell the client it failed — client can retry or show error
        ack({ ok: false, error: "Failed to deliver message" });
      }
    });

    // --- TYPING ---
    socket.on("typing:start", (roomId) => {
      socket
        .to(roomId)
        .emit("typing:update", { roomId, senderId: userId, senderName: name, isTyping: true });
    });

    socket.on("typing:stop", (roomId) => {
      socket
        .to(roomId)
        .emit("typing:update", { roomId, senderId: userId, senderName: name, isTyping: false });
    });

    // --- DISCONNECT ---
    socket.on("disconnect", (reason) => {
      console.log(`Socket disconnected: ${socket.id} (${name}) — reason: ${reason}`);

      // 1. Clear typing state across all rooms
      socket.broadcast.emit("typing:update", {
        roomId: "",
        senderId: userId,
        senderName: name,
        isTyping: false,
      });

      // 2. Remove from presence in all rooms this socket was tracking
      const rooms = getSocketRooms(socket.id);
      rooms.forEach((roomId) => {
        removeUserFromRoom(roomId, userId);
        // Notify remaining room members of updated presence
        socket.to(roomId).emit("presence:update", {
          roomId,
          onlineUsers: getOnlineUsers(roomId),
        });
      });
      clearSocketRooms(socket.id);

      // 3. Persist lastSeen timestamp to MongoDB
      // This is how "last seen 5 minutes ago" works in every chat app
      User.findByIdAndUpdate(userId, { lastSeen: new Date() }).catch(console.error);
    });
  });
};
