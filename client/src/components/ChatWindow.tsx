"use client";

import { MessagePayload } from "@/lib/socket";
import { useEffect, useRef } from "react";

interface Props {
  messages: MessagePayload[];
  isLoadingHistory: boolean;
  historyError: string | null;
  currentUserId?: string | null;
}

export default function ChatWindow({
  messages,
  isLoadingHistory,
  historyError,
  currentUserId,
}: Props) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="border rounded h-64 overflow-y-auto p-3 flex flex-col gap-2 bg-gray-50">
      {isLoadingHistory ? (
        <p className="text-xs text-gray-400 text-center m-auto">Loading history...</p>
      ) : historyError ? (
        <p className="text-xs text-red-500 text-center m-auto">
          Failed to load history: {historyError}
        </p>
      ) : messages.length === 0 ? (
        <p className="text-xs text-gray-400 text-center m-auto">No messages yet</p>
      ) : (
        <>
          {messages.map((m, i) => (
            <div key={i} className={`text-sm ${m.senderId === currentUserId ? "text-right" : ""}`}>
              {m.senderId !== currentUserId && (
                <span className="font-medium">{m.senderName}: </span>
              )}
              <span>{m.message}</span>
              <span className="text-xs text-gray-400 ml-2">
                {new Date(m.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
          <div ref={bottomRef} />
        </>
      )}
    </div>
  );
}
