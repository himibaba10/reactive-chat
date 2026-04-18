import { io, Socket } from "socket.io-client";

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
