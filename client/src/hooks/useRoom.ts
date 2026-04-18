"use client";

import { useAuth } from "@/context/AuthContext";
import { getSocket, MessagePayload } from "@/lib/socket";
import { useCallback, useEffect, useState } from "react";

// Message status — for delivery ticks (pending → delivered / failed)
export type MessageStatus = "pending" | "delivered" | "failed";

export interface TrackedMessage extends MessagePayload {
  status: MessageStatus;
  localId: string; // temp ID to match optimistic msg with ack response
}

interface UseRoomReturn {
  messages: TrackedMessage[];
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  sendMessage: (roomId: string, message: string) => void;
  currentRoom: string | null;
  isLoadingHistory: boolean;
  historyError: string | null;
}

export const useRoom = (): UseRoomReturn => {
  const [messages, setMessages] = useState<TrackedMessage[]>([]);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const socket = getSocket();

    const onMessageReceived = (data: MessagePayload): void => {
      // Incoming messages from others are always "delivered" — we received them
      setMessages((prev) => [...prev, { ...data, status: "delivered", localId: "" }]);
    };
    const onRoomJoined = (data: { roomId: string; name: string }): void => {
      console.log(`${data.name} joined room: ${data.roomId}`);
    };
    const onRoomLeft = (data: { roomId: string; name: string }): void => {
      console.log(`${data.name} left room: ${data.roomId}`);
    };
    const onHistoryLoaded = (history: MessagePayload[]): void => {
      // History messages are already persisted — mark as delivered
      setMessages(history.map((m) => ({ ...m, status: "delivered", localId: "" })));
      setIsLoadingHistory(false);
      setHistoryError(null);
    };
    const onHistoryError = (errMsg: string): void => {
      setHistoryError(errMsg);
      setMessages([]);
      setIsLoadingHistory(false);
    };

    socket.on("message:received", onMessageReceived);
    socket.on("room:joined", onRoomJoined);
    socket.on("room:left", onRoomLeft);
    socket.on("history:loaded", onHistoryLoaded);
    socket.on("history:error", onHistoryError);

    return () => {
      socket.off("message:received", onMessageReceived);
      socket.off("room:joined", onRoomJoined);
      socket.off("room:left", onRoomLeft);
      socket.off("history:loaded", onHistoryLoaded);
      socket.off("history:error", onHistoryError);
    };
  }, []);

  const joinRoom = useCallback((roomId: string): void => {
    const socket = getSocket();
    setMessages([]);
    setIsLoadingHistory(true);
    setHistoryError(null);
    socket.emit("room:join", roomId);
    setCurrentRoom(roomId);
  }, []);

  const leaveRoom = useCallback((roomId: string): void => {
    const socket = getSocket();
    socket.emit("room:leave", roomId);
    setCurrentRoom(null);
    setMessages([]);
    setHistoryError(null);
  }, []);

  const sendMessage = useCallback(
    (roomId: string, message: string): void => {
      const socket = getSocket();
      const localId = `${Date.now()}-${Math.random()}`;

      // Optimistic update — add as "pending" immediately
      const optimistic: TrackedMessage = {
        roomId,
        message,
        senderId: user?.id ?? "",
        senderName: user?.name ?? "You",
        timestamp: Date.now(),
        status: "pending",
        localId,
      };
      setMessages((prev) => [...prev, optimistic]);

      // Emit with acknowledgement callback
      // Server calls ack({ ok: true }) or ack({ ok: false, error: "..." })
      socket.emit("message:send", { roomId, message }, (ack) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.localId === localId ? { ...m, status: ack.ok ? "delivered" : "failed" } : m
          )
        );
      });
    },
    [user]
  );

  return {
    messages,
    joinRoom,
    leaveRoom,
    sendMessage,
    currentRoom,
    isLoadingHistory,
    historyError,
  };
};
