"use client";

interface Props {
  typingUsers: string[];
}

export default function TypingIndicator({ typingUsers }: Props) {
  if (!typingUsers || typingUsers.length === 0) return null;

  const typingText =
    typingUsers.length === 1
      ? `${typingUsers[0]} is typing...`
      : `${typingUsers.slice(0, -1).join(", ")} and ${typingUsers.at(-1)} are typing...`;

  return (
    <div className="h-4">
      <p className="text-xs text-gray-400 italic animate-pulse">{typingText}</p>
    </div>
  );
}
