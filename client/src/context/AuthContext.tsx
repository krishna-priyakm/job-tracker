"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { apiFetch, refreshSession, setAccessToken } from "@/lib/api";

type User = { id: string; email: string };

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  register: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // On first load, try to restore the session using the refresh cookie
  useEffect(() => {
    async function init() {
      const token = await refreshSession();
      if (token) {
        const res = await apiFetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser({ id: data.user.id, email: data.user.email });
        }
      }
      setLoading(false);
    }
    init();
  }, []);

  // Returns an error message, or null when it worked
  async function authenticate(path: string, email: string, password: string) {
    try {
      const res = await apiFetch(path, {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return (data.error as string) || "Something went wrong";
      }
      setAccessToken(data.accessToken);
      setUser(data.user);
      return null;
    } catch {
      return "Cannot reach the server. Is it running?";
    }
  }

  function login(email: string, password: string) {
    return authenticate("/api/auth/login", email, password);
  }

  function register(email: string, password: string) {
    return authenticate("/api/auth/register", email, password);
  }

  async function logout() {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore: we still clear the local session below
    }
    setAccessToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}