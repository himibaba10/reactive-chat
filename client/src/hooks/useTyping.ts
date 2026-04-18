"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getSocket, TypingPayload } from "@/lib/socket";

interface UseTypingReturn {
  typingUsers: string[];
  onTyping: (roomId: string) => void;
}

const TYPING_STOP_DELAY = 1500;

export const useTyping = (): UseTypingReturn => {
  const [typingMap, setTypingMap] = useState<Record<string, string>>({});
  const isTypingRef = useRef(false);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const socket = getSocket();

    const onTypingUpdate = (data: TypingPayload): void => {
      setTypingMap((prev) => {
        const updated = { ...prev };
        if (data.isTyping) {
          updated[data.senderId] = data.senderName;
        } else {
          delete updated[data.senderId];
        }
        return updated;
      });
    };

    socket.on("typing:update", onTypingUpdate);
    return () => {
      socket.off("typing:update", onTypingUpdate);
    };
  }, []);

  // Client just sends roomId — server knows who is typing from the verified token
  const onTyping = useCallback((roomId: string): void => {
    const socket = getSocket();

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit("typing:start", roomId);
    }

    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);

    stopTimerRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socket.emit("typing:stop", roomId);
    }, TYPING_STOP_DELAY);
  }, []);

  return { typingUsers: Object.values(typingMap), onTyping };
};
