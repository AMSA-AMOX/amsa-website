"use client";

import { useState } from "react";
import upcomingEvent from "@/config/upcomingEvent";

function CardDeck({ images }: { images: string[] }) {
  const [topIndex, setTopIndex] = useState(0);
  const count = images.length;

  // Each card's position in the stack relative to the current top
  function stackPosition(i: number) {
    return (i - topIndex + count) % count;
  }

  function advance() {
    setTopIndex((prev) => (prev + 1) % count);
  }

  return (
    <div className="relative w-full max-w-[420px] aspect-[4/3] select-none mx-auto">
      {images.map((src, i) => {
        const pos = stackPosition(i);
        const isTop = pos === 0;

        // Cards further back get more offset / rotation / lower z-index
        const offset = pos * 10;
        const rotate = pos * 3;
        const zIndex = count - pos;
        const opacity = pos > 3 ? 0 : 1;

        return (
          <div
            key={src}
            onClick={isTop ? advance : undefined}
            className="absolute inset-0 rounded-2xl overflow-hidden shadow-xl transition-all duration-400"
            style={{
              transform: `translateX(${offset}px) translateY(${offset}px) rotate(${rotate}deg)`,
              zIndex,
              opacity,
              cursor: isTop ? "pointer" : "default",
              transitionProperty: "transform, opacity",
              transitionDuration: "350ms",
              transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`Event photo ${i + 1}`}
              className="w-full h-full object-cover"
              draggable={false}
            />
          </div>
        );
      })}

      {/* Tap hint on the top card */}
      <div
        className="absolute bottom-3 right-3 z-50 bg-black/50 text-white text-xs px-2 py-1 rounded-full pointer-events-none"
        style={{ zIndex: count + 1 }}
      >
        {topIndex + 1} / {count} · tap to flip
      </div>
    </div>
  );
}

export default function UpcomingEventSection() {
  if (!upcomingEvent.ENABLED) return null;

  return (
    <section
      id={upcomingEvent.sectionId}
      className="w-full bg-[#001049] text-white py-20 px-6"
    >
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
        {/* Card deck */}
        <div className="w-full lg:w-1/2 flex-shrink-0">
          <CardDeck images={upcomingEvent.images} />
        </div>

        {/* Info + CTA */}
        <div className="w-full lg:w-1/2 flex flex-col gap-6">
          <div>
            <p className="text-[#FFCA3A] text-sm font-semibold uppercase tracking-widest mb-2">
              Upcoming Event
            </p>
            <h2
              className="font-bold leading-tight"
              style={{ fontFamily: "Syne-Bold, sans-serif", fontSize: "clamp(1.75rem, 4vw, 2.75rem)" }}
            >
              {upcomingEvent.title}
            </h2>
          </div>

          <p className="text-white/80 text-base leading-relaxed max-w-lg">
            {upcomingEvent.subtitle}
          </p>

          <div className="flex flex-col gap-1 text-sm text-white/60">
            <span>📅 {upcomingEvent.date}</span>
            <span>📍 {upcomingEvent.location}</span>
          </div>

          <a
            href={upcomingEvent.registrationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-[#FFCA3A] text-[#001049] font-bold rounded-2xl px-8 py-4 text-base hover:bg-[#ffd966] transition-colors w-fit"
          >
            Register Now →
          </a>

          <p className="text-white/40 text-xs">
            Registration is free and open to all Mongolian students.
          </p>
        </div>
      </div>
    </section>
  );
}
