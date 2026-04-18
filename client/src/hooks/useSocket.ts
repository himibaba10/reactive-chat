"use client";

import { useEffect, useState } from "react";
import { getSocket, resetSocket, AppSocket } from "@/lib/socket";
import { useAuth } from "@/context/AuthContext";

type ConnectionStatus = "connected" | "disconnected" | "connecting";

interface UseSocketReturn {
  socket: AppSocket | null;
  status: ConnectionStatus;
}

export const useSocket = (): UseSocketReturn => {
  const [socket, setSocket] = useState<AppSocket | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const { isAuthenticated, token } = useAuth();

  useEffect(() => {
    // Don't connect until user is authenticated
    if (!isAuthenticated || !token) return;

    // Recreate socket with the fresh token after login
    resetSocket();
    const s = getSocket();

    const onConnect = (): void => {
      console.log("Socket connected:", s.id);
      setStatus("connected");
    };

    const onDisconnect = (reason: string): void => {
      console.log("Socket disconnected:", reason);
      setStatus("disconnected");
    };

    const onConnectError = (err: Error): void => {
      console.error("Connection error:", err.message);
      setStatus("disconnected");
    };

    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);
    s.on("connect_error", onConnectError);

    s.connect();

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSocket(s);

    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
      s.off("connect_error", onConnectError);
      s.disconnect();
    };
  }, [isAuthenticated, token]);

  return { socket, status };
};
