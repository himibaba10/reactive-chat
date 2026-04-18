"use client";

import { useState } from "react";

interface Props {
  currentRoom: string | null;
  onJoin: (roomId: string) => void;
  onLeave: (roomId: string) => void;
}

export default function RoomControls({ currentRoom, onJoin, onLeave }: Props) {
  const [roomInput, setRoomInput] = useState("");

  const handleJoin = () => {
    const val = roomInput.trim();
    if (!val) return;
    onJoin(val);
    setRoomInput("");
  };

  if (!currentRoom) {
    return (
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
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium">
        Room: <code className="bg-gray-100 px-1 rounded">{currentRoom}</code>
      </span>
      <button className="text-sm text-red-500 underline" onClick={() => onLeave(currentRoom)}>
        Leave
      </button>
    </div>
  );
}
