"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import type { ShellData } from "@/app/api/me/shell/route";

const TTL_MS = 60_000;

// Shared across every consumer (sidebar, banner, …) so the dashboard chrome
// costs exactly one /api/me/shell request per minute, not one per component.
let cache: { key: string; data: ShellData; at: number } | null = null;
let inflight: { key: string; promise: Promise<ShellData> } | null = null;
const listeners = new Set<(d: ShellData) => void>();

const seenAfter = () => {
  try {
    return localStorage.getItem("amsa_notif_seen") ?? "";
  } catch {
    return "";
  }
};

/** Bump this after an action that changes badge counts (approve, mark seen). */
export function invalidateShell() {
  cache = null;
}

export function useShell() {
  const { user, token, authFetch } = useAuth();
  const [shell, setShell] = useState<ShellData | null>(() => cache?.data ?? null);

  const load = useCallback(
    async (force = false) => {
      if (!token) return;
      const key = `${token}:${seenAfter()}`;
      if (!force && cache && cache.key === key && Date.now() - cache.at < TTL_MS) {
        setShell(cache.data);
        return;
      }
      if (!inflight || inflight.key !== key) {
        const promise = authFetch(`/api/me/shell?seenAfter=${encodeURIComponent(seenAfter())}`).then((data: ShellData) => {
          cache = { key, data, at: Date.now() };
          listeners.forEach((fn) => fn(data));
          return data;
        });
        inflight = { key, promise };
        const clear = () => {
          if (inflight?.promise === promise) inflight = null;
        };
        promise.then(clear, clear); // no unhandled rejection; the awaiter below handles errors
      }
      try {
        setShell(await inflight.promise);
      } catch {
        /* keep whatever we had */
      }
    },
    [token, authFetch],
  );

  useEffect(() => {
    if (!user) return;
    listeners.add(setShell);
    void load();
    // Notifications page marks everything seen → the unseen count changes.
    const onSeen = () => void load(true);
    window.addEventListener("amsa-notif-seen", onSeen);
    window.addEventListener("storage", onSeen);
    return () => {
      listeners.delete(setShell);
      window.removeEventListener("amsa-notif-seen", onSeen);
      window.removeEventListener("storage", onSeen);
    };
  }, [user, load]);

  return { shell, refresh: () => load(true) };
}
