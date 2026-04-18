// In-memory presence store — maps roomId -> Set of online users
// This is intentionally simple. We'll explain WHY this breaks at scale
// and fix it with Redis in the next step.

export interface OnlineUser {
  userId: string;
  name: string;
  socketId: string;
}

// roomId -> Map<userId, OnlineUser>
// Using Map<userId> not Set so we can look up and remove by userId efficiently
const roomPresence = new Map<string, Map<string, OnlineUser>>();

export const addUserToRoom = (roomId: string, user: OnlineUser): void => {
  if (!roomPresence.has(roomId)) {
    roomPresence.set(roomId, new Map());
  }
  roomPresence.get(roomId)!.set(user.userId, user);
};

export const removeUserFromRoom = (roomId: string, userId: string): void => {
  const room = roomPresence.get(roomId);
  if (!room) return;
  room.delete(userId);
  // Clean up empty rooms to avoid memory leak
  if (room.size === 0) roomPresence.delete(roomId);
};

export const getOnlineUsers = (roomId: string): OnlineUser[] => {
  return Array.from(roomPresence.get(roomId)?.values() ?? []);
};

// When a socket disconnects we need to remove them from ALL rooms they were in
// We track which rooms each socket joined so we can clean up on disconnect
const socketRooms = new Map<string, Set<string>>(); // socketId -> Set<roomId>

export const trackSocketRoom = (socketId: string, roomId: string): void => {
  if (!socketRooms.has(socketId)) {
    socketRooms.set(socketId, new Set());
  }
  socketRooms.get(socketId)!.add(roomId);
};

export const getSocketRooms = (socketId: string): string[] => {
  return Array.from(socketRooms.get(socketId) ?? []);
};

export const clearSocketRooms = (socketId: string): void => {
  socketRooms.delete(socketId);
};
