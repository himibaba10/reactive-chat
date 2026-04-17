"use client";

import { useState } from "react";
import { useSocket } from "@/hooks/useSocket";
import { useRoom } from "@/hooks/useRoom";

export default function Home() {
  const { status } = useSocket();
  const { messages, joinRoom, leaveRoom, sendMessage, currentRoom } = useRoom();

  const [roomInput, setRoomInput] = useState("");
  const [msgInput, setMsgInput] = useState("");

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

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      {/* Connection Status */}
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

      {/* Room Controls */}
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

      {/* Messages */}
      {currentRoom && (
        <div className="w-full max-w-md flex flex-col gap-4">
          <div className="border rounded h-64 overflow-y-auto p-3 flex flex-col gap-2 bg-gray-50">
            {messages.length === 0 ? (
              <p className="text-xs text-gray-400 text-center mt-auto">No messages yet</p>
            ) : (
              messages.map((m, i) => (
                <div key={i} className="text-sm">
                  <span className="font-medium">{m.senderName}: </span>
                  <span>{m.message}</span>
                </div>
              ))
            )}
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <input
              className="border rounded px-3 py-1 text-sm flex-1"
              placeholder="Type a message..."
              value={msgInput}
              onChange={(e) => setMsgInput(e.target.value)}
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
