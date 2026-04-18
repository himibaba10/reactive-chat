"use client";

import { useState, useRef, useEffect } from "react";
import { useSocket } from "@/hooks/useSocket";
import { useRoom } from "@/hooks/useRoom";
import { useTyping } from "@/hooks/useTyping";

export default function Home() {
  const { status } = useSocket();
  const { messages, joinRoom, leaveRoom, sendMessage, currentRoom, isLoadingHistory } = useRoom();
  const { typingUsers, onTyping } = useTyping();

  const [roomInput, setRoomInput] = useState("");
  const [msgInput, setMsgInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleJoin = (): void => {
    if (!roomInput.trim()) return;
    joinRoom(roomInput.trim());
  };

  const handleSend = (): void => {
    if (!msgInput.trim() || !currentRoom) return;
    sendMessage({
      roomId: currentRoom,
      message: msgInput.trim(),
      senderId: "test-user",
      senderName: "You",
      timestamp: Date.now(),
    });
    setMsgInput("");
  };

  const handleMsgInput = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setMsgInput(e.target.value);
    if (currentRoom) {
      onTyping(currentRoom, "test-user", "You");
    }
  };

  // Build typing indicator text: "Alice is typing...", "Alice and Bob are typing..."
  const typingText =
    typingUsers.length === 0
      ? null
      : typingUsers.length === 1
        ? `${typingUsers[0]} is typing...`
        : `${typingUsers.slice(0, -1).join(", ")} and ${typingUsers.at(-1)} are typing...`;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      {/* Connection status */}
      <div className="flex items-center gap-2">
        <span
          className={`h-3 w-3 rounded-full ${
            status === "connected"
              ? "bg-green-500"
              : status === "connecting"
                ? "bg-yellow-500 animate-pulse"
                : "bg-red-500"
          }`}
        />
        <span className="text-sm text-gray-500 capitalize">{status}</span>
      </div>

      {/* Room controls */}
      {!currentRoom ? (
        <div className="flex gap-2">
          <input
            className="border rounded px-3 py-1 text-sm"
            placeholder="Room ID (e.g. general)"
            value={roomInput}
            onChange={(e) => setRoomInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
          />
          <button className="bg-black text-white text-sm px-4 py-1 rounded" onClick={handleJoin}>
            Join Room
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">
            Room: <code className="bg-gray-100 px-1 rounded">{currentRoom}</code>
          </span>
          <button className="text-sm text-red-500 underline" onClick={() => leaveRoom(currentRoom)}>
            Leave
          </button>
        </div>
      )}

      {/* Chat window */}
      {currentRoom && (
        <div className="w-full max-w-md flex flex-col gap-2">
          <div className="border rounded h-64 overflow-y-auto p-3 flex flex-col gap-2 bg-gray-50">
            {isLoadingHistory ? (
              <p className="text-xs text-gray-400 text-center m-auto">Loading history...</p>
            ) : messages.length === 0 ? (
              <p className="text-xs text-gray-400 text-center m-auto">No messages yet</p>
            ) : (
              <>
                {messages.map((m, i) => (
                  <div key={i} className="text-sm">
                    <span className="font-medium">{m.senderName}: </span>
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

          {/* Typing indicator — fixed height so UI doesn't jump */}
          <div className="h-4">
            {typingText && (
              <p className="text-xs text-gray-400 italic animate-pulse">{typingText}</p>
            )}
          </div>

          {/* Message input */}
          <div className="flex gap-2">
            <input
              className="border rounded px-3 py-1 text-sm flex-1"
              placeholder="Type a message..."
              value={msgInput}
              onChange={handleMsgInput}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button className="bg-black text-white text-sm px-4 py-1 rounded" onClick={handleSend}>
              Send
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
