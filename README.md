# reactive-chat

A real-time chat app built to learn Socket.IO.

## Stack

- **Client**: Next.js 15, Tailwind CSS, shadcn/ui
- **Server**: Express.js, TypeScript, Socket.IO, Mongoose
- **DB**: MongoDB Atlas

## Structure

\`\`\`
reactive-chat/
├── client/ # Next.js frontend
└── server/ # Express + Socket.IO backend
\`\`\`

## Running locally

### Client

\`\`\`bash
cd client && bun dev
\`\`\`

### Server

\`\`\`bash
cd server && bun dev
\`\`\`

## Lessons learned

- **Socket flow:** client emits `room:join` → server joins the socket, emits `room:joined` to the room, loads recent messages, then emits `history:loaded` back only to the joining client.
- **Client loading state:** `useRoom` sets `isLoadingHistory` true when joining; `onHistoryLoaded` clears it (`setIsLoadingHistory(false)`) when `history:loaded` arrives. The server now sends an empty `history:loaded` on DB errors so the client won't stay stuck.
- **Targeted emits vs broadcast:** use `socket.emit` to target a single client, `io.to(room).emit` to broadcast to all clients in a room, and `socket.to(room).emit` to broadcast excluding the sender.
- **Optimistic UI & persistence:** `sendMessage` performs an optimistic update locally, emits `message:send`, the server broadcasts to other clients and persists to the DB asynchronously (fire-and-forget).
- **DB writes should not block real-time delivery:** write to the database in the background and handle/log failures instead of awaiting them before broadcasting.
- **Event listener hygiene:** register socket handlers inside `useEffect` and remove them in the cleanup to avoid duplicate handlers and memory leaks.
- **Error handling:** prefer explicit error events (e.g. `history:error`) and visible UI (toast/snack) for failures. As a safe fallback this project emits an empty history on load failures.
- **Error handling:** server emits `history:error` on DB read failures and the client displays a small error banner in the chat window. The server also emits an empty `history:loaded` as a fallback so the client clears the loading state.
- **Next improvements to explore:** delivery receipts, typing indicators, paginated history (infinite scroll), visible error UI, and better tests.

You learned these while building — feel free to update this section as you discover more.
