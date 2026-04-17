import { io, Socket } from "socket.io-client";

// Mirroring server event types on the client
// Client SENDS these → ServerToClientEvents on server
export interface ServerToClientEvents {
  "message:received": (data: MessagePayload) => void;
  "room:joined": (data: { roomId: string; socketId: string }) => void;
  "room:left": (data: { roomId: string; socketId: string }) => void;
}

// Client LISTENS to these ← ClientToServerEvents on server
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

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: AppSocket | null = null;

export const getSocket = (): AppSocket => {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SERVER_URL as string, {
      autoConnect: false,
    });
  }
  return socket;
};
