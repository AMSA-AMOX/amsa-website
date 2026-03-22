"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";

export type User = {
  id: number;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  acceptanceStatus: string;
  profilePic: string | null;
  level: string | null;
  bio: string | null;
};

export type SignupPayload = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (opts: SignupPayload) => Promise<User>;
  logout: () => void;
  authFetch: (path: string, opts?: RequestInit) => Promise<any>;
  updateUser: (partial: Partial<User>) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("amsa_auth");
    if (!stored) {
      setLoading(false);
      return;
    }
    try {
      const parsed = JSON.parse(stored);
      setToken(parsed.token);
      setUser(parsed.user);
    } catch {
      localStorage.removeItem("amsa_auth");
    } finally {
      setLoading(false);
    }
  }, []);

  const saveAuth = (t: string, u: User) => {
    setToken(t);
    setUser(u);
    localStorage.setItem("amsa_auth", JSON.stringify({ token: t, user: u }));
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

  const signup = async (opts: SignupPayload): Promise<User> => {
    const data = await api("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ ...opts, email: opts.email.trim() }),
    });
    saveAuth(data.token, data.user);
    return data.user;
  };

  const logout = () => {
    clearAuth();
  };

  const updateUser = (partial: Partial<User>) => {
    if (!user || !token) return;
    const updated = { ...user, ...partial };
    setUser(updated);
    localStorage.setItem("amsa_auth", JSON.stringify({ token, user: updated }));
  };

  const authFetch = (path: string, opts: RequestInit = {}) => {
    if (!token) return Promise.reject({ message: "Not authenticated" });
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
      value={{ user, token, login, signup, logout, authFetch, loading, updateUser }}
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
