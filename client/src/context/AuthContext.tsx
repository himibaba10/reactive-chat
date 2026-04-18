"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from "react";

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Token stored in MEMORY (module-level variable), not localStorage.
// Why? localStorage is accessible via JS — XSS attack can steal it.
// Memory storage dies on page refresh — tradeoff is user logs in again.
// For production you'd use httpOnly cookies (server sets it, JS can't read it).
// For learning purposes, memory is fine and teaches the concept cleanly.
let memoryToken: string | null = null;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const login = useCallback((newToken: string, newUser: User) => {
    memoryToken = newToken;
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    memoryToken = null;
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};

// Exported so socket lib can read the token without React
export const getMemoryToken = (): string | null => memoryToken;
