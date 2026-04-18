"use client";

import React, { useState } from "react";

interface Props {
  currentRoom: string | null;
  onSend: (message: string) => void;
  onTyping?: (roomId: string) => void;
}

export default function MessageInput({ currentRoom, onSend, onTyping }: Props) {
  const [msgInput, setMsgInput] = useState("");

  const handleSend = (): void => {
    if (!msgInput.trim() || !currentRoom) return;
    onSend(msgInput.trim());
    setMsgInput("");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setMsgInput(e.target.value);
    if (currentRoom && onTyping) onTyping(currentRoom);
  };

  return (
    <div className="flex gap-2">
      <input
        className="border rounded px-3 py-1 text-sm flex-1"
        placeholder="Type a message..."
        value={msgInput}
        onChange={handleChange}
        onKeyDown={(e) => e.key === "Enter" && handleSend()}
      />
      <button className="bg-black text-white text-sm px-4 py-1 rounded" onClick={handleSend}>
        Send
      </button>
    </div>
  );
}
