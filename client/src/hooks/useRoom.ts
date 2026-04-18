"use client";

import { useEffect, useState, useCallback } from "react";
import { getSocket, MessagePayload } from "@/lib/socket";
import { useAuth } from "@/context/AuthContext";

interface UseRoomReturn {
  messages: MessagePayload[];
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  sendMessage: (roomId: string, message: string) => void;
  currentRoom: string | null;
  isLoadingHistory: boolean;
}

export const useRoom = (): UseRoomReturn => {
  const [messages, setMessages] = useState<MessagePayload[]>([]);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const socket = getSocket();

    const onMessageReceived = (data: MessagePayload): void => {
      setMessages((prev) => [...prev, data]);
    };
    const onRoomJoined = (data: { roomId: string; name: string }): void => {
      console.log(`${data.name} joined room: ${data.roomId}`);
    };
    const onRoomLeft = (data: { roomId: string; name: string }): void => {
      console.log(`${data.name} left room: ${data.roomId}`);
    };
    const onHistoryLoaded = (history: MessagePayload[]): void => {
      setMessages(history);
      setIsLoadingHistory(false);
    };

    socket.on("message:received", onMessageReceived);
    socket.on("room:joined", onRoomJoined);
    socket.on("room:left", onRoomLeft);
    socket.on("history:loaded", onHistoryLoaded);

    return () => {
      socket.off("message:received", onMessageReceived);
      socket.off("room:joined", onRoomJoined);
      socket.off("room:left", onRoomLeft);
      socket.off("history:loaded", onHistoryLoaded);
    };
  }, []);

  const joinRoom = useCallback((roomId: string): void => {
    const socket = getSocket();
    setMessages([]);
    setIsLoadingHistory(true);
    socket.emit("room:join", roomId);
    setCurrentRoom(roomId);
  }, []);

  const leaveRoom = useCallback((roomId: string): void => {
    const socket = getSocket();
    socket.emit("room:leave", roomId);
    setCurrentRoom(null);
    setMessages([]);
  }, []);

  const sendMessage = useCallback(
    (roomId: string, message: string): void => {
      const socket = getSocket();
      // Optimistic update — build payload locally using auth context user
      const optimistic: MessagePayload = {
        roomId,
        message,
        senderId: user?.id ?? "",
        senderName: user?.name ?? "You",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, optimistic]);
      // Only send roomId + message — server builds the rest from verified token
      socket.emit("message:send", { roomId, message });
    },
    [user]
  );

  return { messages, joinRoom, leaveRoom, sendMessage, currentRoom, isLoadingHistory };
};
