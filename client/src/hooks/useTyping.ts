"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getSocket, TypingPayload } from "@/lib/socket";

interface UseTypingReturn {
  typingUsers: string[]; // names of users currently typing (excluding you)
  onTyping: (roomId: string, senderId: string, senderName: string) => void;
}

const TYPING_STOP_DELAY = 1500; // ms of inactivity before we emit typing:stop

export const useTyping = (): UseTypingReturn => {
  // Map of senderId -> senderName for users currently typing
  const [typingMap, setTypingMap] = useState<Record<string, string>>({});

  // Track whether WE are currently typing (so we don't spam typing:start)
  const isTypingRef = useRef(false);

  // Timer ref — cleared and reset on every keystroke
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const socket = getSocket();

    const onTypingUpdate = (data: TypingPayload): void => {
      setTypingMap((prev) => {
        const updated = { ...prev };
        if (data.isTyping) {
          // Add to typing map
          updated[data.senderId] = data.senderName;
        } else {
          // Remove from typing map
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

  // Call this on every input onChange
  const onTyping = useCallback((roomId: string, senderId: string, senderName: string): void => {
    const socket = getSocket();

    // Only emit typing:start if we weren't already typing
    // This is the KEY optimization — one event at the START, not one per keypress
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit("typing:start", { roomId, senderId, senderName, isTyping: true });
    }

    // Clear the previous stop timer and start a new one
    // This resets the countdown on every keystroke
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
    }

    stopTimerRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socket.emit("typing:stop", { roomId, senderId, senderName, isTyping: false });
    }, TYPING_STOP_DELAY);
  }, []);

  // Derive display list from the map
  const typingUsers = Object.values(typingMap);

  return { typingUsers, onTyping };
};
