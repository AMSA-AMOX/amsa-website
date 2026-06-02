"use client";

import { useEffect, useState } from "react";
import type { College } from "./types";

const CACHE_KEY = "research_colleges_cache_v6";
const CACHE_TTL_MS = 10 * 60 * 1000;

let memoryCache: { colleges: College[]; fetchedAt: number } | null = null;
let pending: Promise<College[]> | null = null;

async function fetchColleges(): Promise<College[]> {
  const res = await fetch("/api/colleges");
  if (!res.ok) throw new Error("Failed to load college data");
  const data = (await res.json()) as { colleges?: College[] };
  return data.colleges ?? [];
}

function readSessionCache(): { colleges: College[]; fetchedAt: number } | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { colleges: College[]; fetchedAt: number };
    if (!parsed?.fetchedAt || !Array.isArray(parsed.colleges)) return null;
    if (Date.now() - parsed.fetchedAt > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeSessionCache(payload: { colleges: College[]; fetchedAt: number }) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // ignore quota errors
  }
}

export function useCollegesData() {
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const now = Date.now();
    if (memoryCache && now - memoryCache.fetchedAt <= CACHE_TTL_MS) {
      setColleges(memoryCache.colleges);
      setLoading(false);
      return;
    }

    const session = readSessionCache();
    if (session) {
      memoryCache = session;
      setColleges(session.colleges);
      setLoading(false);
      return;
    }

    if (!pending) {
      pending = fetchColleges()
        .then((rows) => {
          const payload = { colleges: rows, fetchedAt: Date.now() };
          memoryCache = payload;
          writeSessionCache(payload);
          return rows;
        })
        .finally(() => {
          pending = null;
        });
    }

    pending
      .then((rows) => {
        setColleges(rows);
        setLoading(false);
      })
      .catch((e) => {
        setError(e?.message ?? "Failed to load college data.");
        setLoading(false);
      });
  }, []);

  return { colleges, loading, error };
}

