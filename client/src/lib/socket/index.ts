import { io, Socket } from "socket.io-client";

// KEY CONCEPT: We create the socket instance ONCE and reuse it.
// If you create it inside a component, every re-render = new connection = disaster.
// This module-level singleton ensures one connection for the entire app lifetime.
let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SERVER_URL as string, {
      autoConnect: false, // we connect manually — gives us control
    });
  }
  return socket;
};
