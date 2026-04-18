import { getMemoryToken } from "@/context/AuthContext";
import { io, Socket } from "socket.io-client";

export interface OnlineUser {
  userId: string;
  name: string;
  socketId: string;
}

export interface ServerToClientEvents {
  "message:received": (data: MessagePayload) => void;
  "room:joined": (data: { roomId: string; socketId: string; name: string }) => void;
  "room:left": (data: { roomId: string; socketId: string; name: string }) => void;
  "history:loaded": (messages: MessagePayload[]) => void;
  "history:error": (message: string) => void;
  "typing:update": (data: TypingPayload) => void;
  "presence:update": (data: { roomId: string; onlineUsers: OnlineUser[] }) => void; // NEW
}

export interface ClientToServerEvents {
  "room:join": (roomId: string) => void;
  "room:leave": (roomId: string) => void;
  // Acknowledgement: 2nd arg is a callback the server calls back with AckResponse
  "message:send": (
    data: Pick<MessagePayload, "roomId" | "message">,
    ack: (res: AckResponse) => void
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

export interface AckResponse {
  ok: boolean;
  error?: string;
}

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: AppSocket | null = null;

export const getSocket = (): AppSocket => {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SERVER_URL as string, {
      autoConnect: false,
      auth: { token: getMemoryToken() },
    });
  }
  return socket;
};

export const resetSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
