"use client";

interface Props {
  userName?: string | null;
  logout: () => void;
  status: string;
}

export default function Header({ userName, logout, status }: Props) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm font-medium">Hey, {userName}</span>
      <button className="text-xs text-gray-400 underline" onClick={logout}>
        Logout
      </button>
      <div className="flex items-center gap-1.5">
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            status === "connected"
              ? "bg-green-500"
              : status === "connecting"
                ? "bg-yellow-500 animate-pulse"
                : "bg-red-500"
          }`}
        />
        <span className="text-xs text-gray-400 capitalize">{status}</span>
      </div>
    </div>
  );
}
