"use client";

import { useEffect, useState } from "react";
import { getSocket, OnlineUser } from "@/lib/socket";

interface UsePresenceReturn {
  onlineUsers: OnlineUser[];
}

export const usePresence = (roomId: string | null): UsePresenceReturn => {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  useEffect(() => {
    const socket = getSocket();

    const onPresenceUpdate = (data: { roomId: string; onlineUsers: OnlineUser[] }): void => {
      if (data.roomId === roomId) {
        setOnlineUsers(data.onlineUsers);
      }
    };

    socket.on("presence:update", onPresenceUpdate);

    // Reset when room changes — inside the event handler, not directly in effect body
    return () => {
      socket.off("presence:update", onPresenceUpdate);
      setOnlineUsers([]);  
    };
  }, [roomId]);

  return { onlineUsers };
};
