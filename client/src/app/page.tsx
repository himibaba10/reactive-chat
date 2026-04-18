"use client";

import { useAuth } from "@/context/AuthContext";
import { useRoom } from "@/hooks/useRoom";
import { useSocket } from "@/hooks/useSocket";
import { useTyping } from "@/hooks/useTyping";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import ChatWindow from "@/components/ChatWindow";
import Header from "@/components/Header";
import MessageInput from "@/components/MessageInput";
import RoomControls from "@/components/RoomControls";
import TypingIndicator from "@/components/TypingIndicator";

export default function Home() {
  const { isAuthenticated, user, logout } = useAuth();
  const router = useRouter();
  const { status } = useSocket();
  const {
    messages,
    joinRoom,
    leaveRoom,
    sendMessage,
    currentRoom,
    isLoadingHistory,
    historyError,
  } = useRoom();
  const { typingUsers, onTyping } = useTyping();

  useEffect(() => {
    if (!isAuthenticated) router.push("/login");
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  const handleSend = (message: string): void => {
    if (!currentRoom) return;
    sendMessage(currentRoom, message);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <Header userName={user?.name} logout={logout} status={status} />

      <RoomControls currentRoom={currentRoom} onJoin={joinRoom} onLeave={leaveRoom} />

      {currentRoom && (
        <div className="w-full max-w-md flex flex-col gap-2">
          <ChatWindow
            messages={messages}
            isLoadingHistory={isLoadingHistory}
            historyError={historyError}
            currentUserId={user?.id ?? null}
          />

          <TypingIndicator typingUsers={typingUsers} />

          <MessageInput currentRoom={currentRoom} onSend={handleSend} onTyping={onTyping} />
        </div>
      )}
    </main>
  );
}
