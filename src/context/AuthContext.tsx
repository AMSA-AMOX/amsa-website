"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";

type User = {
  id: number;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
};

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (opts: {
    email?: string;
    eduEmail?: string;
    personalEmail?: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<User>;
  logout: () => void;
  authFetch: (path: string, opts?: RequestInit) => Promise<any>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore from localStorage on first mount
  useEffect(() => {
    const stored = localStorage.getItem("amsa_auth");
    if (!stored) {
      setLoading(false);
      return;
    }
    try {
      const { token, user } = JSON.parse(stored);
      setToken(token);
      setUser(user);
    } catch {
      localStorage.removeItem("amsa_auth");
    } finally {
      setLoading(false);
    }
  }, []);

  const saveAuth = (token: string, user: User) => {
    setToken(token);
    setUser(user);
    localStorage.setItem("amsa_auth", JSON.stringify({ token, user }));
  };

  const clearAuth = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("amsa_auth");
  };

  const login = async (email: string, password: string): Promise<User> => {
    const data = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    saveAuth(data.token, data.user);
    return data.user;
  };

  const signup = async ({
    email,
    eduEmail,
    personalEmail,
    password,
    firstName,
    lastName,
  }: {
    email?: string;
    eduEmail?: string;
    personalEmail?: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<User> => {
    const emailToSend = (email || eduEmail || "").trim();
    const data = await api("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        email: emailToSend,
        personalEmail,
        password,
        firstName,
        lastName,
      }),
    });
    saveAuth(data.token, data.user);
    return data.user;
  };

  const logout = () => {
    clearAuth();
  };

  const authFetch = (path: string, opts: RequestInit = {}) => {
    if (!token) {
      return Promise.reject({ message: "Not authenticated" });
    }
    return api(path, {
      ...opts,
      headers: {
        ...((opts.headers as Record<string, string>) || {}),
        Authorization: `Bearer ${token}`,
      },
    });
  };

  return (
    <AuthContext.Provider
      value={{ user, token, login, signup, logout, authFetch, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
