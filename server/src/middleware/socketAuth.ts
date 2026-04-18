import { Socket } from "socket.io";
import { verifyToken, JwtPayload } from "../config/jwt";
import { ClientToServerEvents, ServerToClientEvents } from "../socket";

// Extend Socket's data property so TypeScript knows what's on socket.data
declare module "socket.io" {
  interface SocketData {
    user: JwtPayload;
  }
}

type AuthSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

// io.use() middleware — runs on every new connection BEFORE "connection" fires
// If we call next(err), the connection is rejected. Simple.
export const socketAuthMiddleware = (socket: AuthSocket, next: (err?: Error) => void): void => {
  // Client sends token in socket.handshake.auth.token
  // This is the standard Socket.IO way — NOT in headers
  const token = socket.handshake.auth?.token as string | undefined;

  if (!token) {
    return next(new Error("Authentication required"));
  }

  try {
    const payload = verifyToken(token);
    // Attach user to socket.data — available in every event handler
    socket.data.user = payload;
    next(); // allow connection
  } catch {
    next(new Error("Invalid or expired token"));
  }
};
