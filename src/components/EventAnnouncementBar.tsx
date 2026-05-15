"use client";

import { useState } from "react";
import upcomingEvent from "@/config/upcomingEvent";

export default function EventAnnouncementBar() {
  const [dismissed, setDismissed] = useState(false);

  if (!upcomingEvent.ENABLED || dismissed) return null;

  return (
    <div
      className="grain-overlay relative w-full overflow-hidden flex items-center justify-center py-2 px-4"
      style={{ background: "radial-gradient(ellipse at 50% 150%, #FFCA3A 30%, #FF4500 100%)" }}
    >
      <a
        href={upcomingEvent.pageUrl}
        className="relative z-10 flex items-center gap-2 text-sm font-bold text-[#001049] hover:underline text-center"
      >
        <span>🎉</span>
        <span>{upcomingEvent.barText}</span>
        <span className="underline underline-offset-2">{upcomingEvent.barCta}</span>
      </a>

      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss announcement"
        className="absolute right-3 top-1/2 -translate-y-1/2 z-10 text-[#001049] opacity-60 hover:opacity-100 text-lg leading-none"
      >
        ×
      </button>
    </div>
  );
}
