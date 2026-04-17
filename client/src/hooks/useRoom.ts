"use client";

import { useEffect, useState, useCallback } from "react";
import { getSocket, MessagePayload } from "@/lib/socket";

interface UseRoomReturn {
  messages: MessagePayload[];
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  sendMessage: (data: MessagePayload) => void;
  currentRoom: string | null;
}

export const useRoom = (): UseRoomReturn => {
  const [messages, setMessages] = useState<MessagePayload[]>([]);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);

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

    socket.on("message:received", onMessageReceived);
    socket.on("room:joined", onRoomJoined);
    socket.on("room:left", onRoomLeft);

    return () => {
      socket.off("message:received", onMessageReceived);
      socket.off("room:joined", onRoomJoined);
      socket.off("room:left", onRoomLeft);
    };
  }, []);

  const joinRoom = useCallback((roomId: string): void => {
    const socket = getSocket();
    socket.emit("room:join", roomId);
    setCurrentRoom(roomId);
    setMessages([]); // clear messages when switching rooms
  }, []);

  const leaveRoom = useCallback((roomId: string): void => {
    const socket = getSocket();
    socket.emit("room:leave", roomId);
    setCurrentRoom(null);
    setMessages([]);
  }, []);

  const sendMessage = useCallback((data: MessagePayload): void => {
    const socket = getSocket();
    // Optimistic update — add your own message locally immediately
    // Don't wait for server to echo it back. Feels instant to the user.
    setMessages((prev) => [...prev, data]);
    socket.emit("message:send", data);
  }, []);

  return { messages, joinRoom, leaveRoom, sendMessage, currentRoom };
};
