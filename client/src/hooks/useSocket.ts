"use client";

import { useEffect, useState } from "react";
import { getSocket, AppSocket } from "@/lib/socket";

type ConnectionStatus = "connected" | "disconnected" | "connecting";

interface UseSocketReturn {
  socket: AppSocket | null;
  status: ConnectionStatus;
}

export const useSocket = (): UseSocketReturn => {
  const [socket, setSocket] = useState<AppSocket | null>(null);
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
  }, []);

  return { socket, status };
};
