"use client";

import { useEffect, useState } from "react";
import { getSocket } from "@/lib/socket";
import { Socket } from "socket.io-client";

type ConnectionStatus = "connected" | "disconnected" | "connecting";

interface UseSocketReturn {
  socket: Socket | null;
  status: ConnectionStatus;
}

export const useSocket = (): UseSocketReturn => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");

  useEffect(() => {
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

    // Register listeners before connecting — never miss the first event
    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);
    s.on("connect_error", onConnectError);

    s.connect();

    // One-time initialization — not a reactive state update, safe to call directly
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSocket(s);

    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
      s.off("connect_error", onConnectError);
      s.disconnect();
    };
  }, []);

  return { socket, status };
};
