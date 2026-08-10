"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type SessionUser = { name: string } | null;

type SessionContextValue = {
  user: SessionUser;
  login: (user: SessionUser) => void;
  logout: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser>(null);

  const login = (user: SessionUser) => setUser(user);
  const logout = () => setUser(null);

  return (
    <SessionContext.Provider value={{ user, login, logout }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return ctx;
}
