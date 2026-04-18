"use client";

import { getSocket, MessagePayload } from "@/lib/socket";
import { useCallback, useEffect, useState } from "react";

interface UseRoomReturn {
  messages: MessagePayload[];
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  sendMessage: (data: MessagePayload) => void;
  currentRoom: string | null;
  isLoadingHistory: boolean;
}

export const useRoom = (): UseRoomReturn => {
  const [messages, setMessages] = useState<MessagePayload[]>([]);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    const socket = getSocket();

    const onMessageReceived = (data: MessagePayload): void => {
      setMessages((prev) => [...prev, data]);
    };

    const onRoomJoined = (data: { roomId: string; socketId: string }): void => {
      console.log(`${data.socketId} joined room: ${data.roomId}`);
    };

    const onRoomLeft = (data: { roomId: string; socketId: string }): void => {
      console.log(`${data.socketId} left room: ${data.roomId}`);
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

  const sendMessage = useCallback((data: MessagePayload): void => {
    const socket = getSocket();
    setMessages((prev) => [...prev, data]);
    socket.emit("message:send", data);
  }, []);

  return { messages, joinRoom, leaveRoom, sendMessage, currentRoom, isLoadingHistory };
};
