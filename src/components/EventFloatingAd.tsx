"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import upcomingEvent from "@/config/upcomingEvent";

export default function EventFloatingAd() {
  const [dismissed, setDismissed] = useState(false);
  const pathname = usePathname();

  if (!upcomingEvent.ENABLED || dismissed || pathname === upcomingEvent.pageUrl) return null;

  return (
    <div className="fixed bottom-8 right-6 z-50 flex flex-col items-end gap-2">
      {/* Dismiss */}
      <button
        onClick={() => setDismissed(true)}
        aria-label="Close"
        className="self-end bg-white/80 backdrop-blur text-gray-500 hover:text-gray-800 rounded-full w-6 h-6 flex items-center justify-center text-sm shadow leading-none"
      >
        ×
      </button>

      <Link href={upcomingEvent.pageUrl} className="group block">
        {/* Card */}
        <div
          className="relative w-44 rounded-xl overflow-hidden shadow-2xl border-2 border-white"
          style={{ animation: "float-bob 3.2s ease-in-out infinite" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/2026/cyf/cyf1.jpg"
            alt={upcomingEvent.title}
            className="w-full object-contain"
            draggable={false}
          />

          {/* Hover CTA pill */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <span className="bg-[#FFCA3A] text-[#001049] text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
              Register Now →
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
