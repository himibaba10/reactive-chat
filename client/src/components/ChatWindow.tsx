"use client";

import { OnlineUser } from "@/lib/socket";
import { TrackedMessage } from "@/hooks/useRoom";
import { useEffect, useRef } from "react";

interface Props {
  messages: TrackedMessage[];
  isLoadingHistory: boolean;
  historyError: string | null;
  currentUserId?: string | null;
  onlineUsers: OnlineUser[];
}

// Delivery tick indicator
const StatusTick = ({ status }: { status: TrackedMessage["status"] }) => {
  if (status === "pending") return <span className="text-xs text-gray-300 ml-1">⏳</span>;
  if (status === "delivered") return <span className="text-xs text-blue-400 ml-1">✓</span>;
  if (status === "failed") return <span className="text-xs text-red-400 ml-1">✗</span>;
  return null;
};

export default function ChatWindow({
  messages,
  isLoadingHistory,
  historyError,
  currentUserId,
  onlineUsers,
}: Props) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col gap-2">
      {/* Online users bar */}
      {onlineUsers.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="h-2 w-2 rounded-full bg-green-400 inline-block" />
          {onlineUsers.map((u) => u.name).join(", ")}
          <span>online</span>
        </div>
      )}

      {/* Message list */}
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
            {messages.map((m, i) => {
              const isMine = m.senderId === currentUserId;
              return (
                <div
                  key={i}
                  className={`text-sm flex flex-col ${isMine ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`px-2 py-1 rounded-lg max-w-xs ${isMine ? "bg-black text-white" : "bg-white border"}`}
                  >
                    {!isMine && (
                      <p className="text-xs font-medium text-gray-500 mb-0.5">{m.senderName}</p>
                    )}
                    <span>{m.message}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-xs text-gray-400">
                      {new Date(m.timestamp).toLocaleTimeString()}
                    </span>
                    {isMine && <StatusTick status={m.status} />}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </>
        )}
      </div>
    </div>
  );
}
