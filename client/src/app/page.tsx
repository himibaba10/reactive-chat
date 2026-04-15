"use client";

import { useSocket } from "@/hooks/useSocket";

export default function Home() {
  const { status } = useSocket();

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <h1 className="text-2xl font-bold">reactive-chat</h1>
        <div className="flex items-center gap-2">
          <span
            className={`h-3 w-3 rounded-full ${
              status === "connected"
                ? "bg-green-500"
                : status === "connecting"
                  ? "bg-yellow-500"
                  : "bg-red-500"
            }`}
          />
          <span className="text-sm text-gray-500 capitalize">{status}</span>
        </div>
      </div>
    </main>
  );
}
