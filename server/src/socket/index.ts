import { Server, Socket } from "socket.io";

// These are the events our app uses — typed so no typos ever
// This is a shared contract between client and server
export interface ServerToClientEvents {
  "message:received": (data: MessagePayload) => void;
  "room:joined": (data: { roomId: string; socketId: string }) => void;
  "room:left": (data: { roomId: string; socketId: string }) => void;
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

// This function takes the io instance and registers all socket logic.
// Keeps index.ts clean — one line call vs 100 lines of socket code.
export const registerSocketHandlers = (
  io: Server<ClientToServerEvents, ServerToClientEvents>
): void => {
  io.on("connection", (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
    console.log(`Socket connected: ${socket.id}`);

    // --- ROOM: JOIN ---
    // socket.join(roomId) adds this socket to a named room.
    // After this, any io.to(roomId).emit(...) reaches this socket.
    socket.on("room:join", (roomId) => {
      socket.join(roomId);
      console.log(`${socket.id} joined room: ${roomId}`);

      // Notify EVERYONE in the room (including the joiner)
      io.to(roomId).emit("room:joined", { roomId, socketId: socket.id });
    });

    // --- ROOM: LEAVE ---
    socket.on("room:leave", (roomId) => {
      socket.leave(roomId);
      console.log(`${socket.id} left room: ${roomId}`);

      // Notify everyone still in the room (NOT the leaver — they've left)
      socket.to(roomId).emit("room:left", { roomId, socketId: socket.id });
    });

    // --- MESSAGE: SEND ---
    socket.on("message:send", (data) => {
      console.log(`Message in room ${data.roomId} from ${data.senderName}: ${data.message}`);

      // KEY: socket.to(roomId) broadcasts to everyone in the room EXCEPT the sender.
      // Use io.to(roomId) if you also want the sender to receive it.
      socket.to(data.roomId).emit("message:received", data);
    });

    // --- DISCONNECT ---
    socket.on("disconnect", (reason) => {
      console.log(`Socket disconnected: ${socket.id} — reason: ${reason}`);
      // NOTE: Socket.IO auto-removes the socket from all rooms on disconnect.
      // You don't need to manually call socket.leave() here.
    });
  });
};
