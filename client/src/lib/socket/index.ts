import { io, Socket } from "socket.io-client";
import { getMemoryToken } from "@/context/AuthContext";

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

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: AppSocket | null = null;

export const getSocket = (): AppSocket => {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SERVER_URL as string, {
      autoConnect: false,
      // Token is sent during the WebSocket handshake in socket.handshake.auth on server
      auth: { token: getMemoryToken() },
    });
  }
  return socket;
};

// Call this after login — recreates socket with fresh token
export const resetSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
