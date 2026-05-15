"use client";

import { useState } from "react";
import { notFound } from "next/navigation";
import upcomingEvent from "@/config/upcomingEvent";

const OFFSET = 24; // px gap between stacked cards

function CardDeck({ images }: { images: string[] }) {
  const [topIndex, setTopIndex] = useState(0);
  const count = images.length;

  function stackPos(i: number) {
    return (i - topIndex + count) % count;
  }

  function advance() {
    setTopIndex((prev) => (prev + 1) % count);
  }

  const cardWidth = `calc(100% - ${(count - 1) * OFFSET}px)`;

  return (
    <div
      className="relative select-none cursor-pointer"
      style={{ paddingRight: (count - 1) * OFFSET, paddingBottom: (count - 1) * OFFSET }}
      onClick={advance}
    >
      {/* Invisible spacer — natural image height, zero white bars */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={images[topIndex]} alt="" aria-hidden className="w-full block invisible" draggable={false} />

      {images.map((src, i) => {
        const pos = stackPos(i);
        return (
          <div
            key={src}
            className="absolute top-0 left-0 rounded-2xl overflow-hidden shadow-xl"
            style={{
              width: cardWidth,
              transform: `translateX(${pos * OFFSET}px) translateY(${pos * OFFSET}px) rotate(${pos * 3}deg)`,
              zIndex: count - pos,
              opacity: pos > 3 ? 0 : 1,
              transition: "transform 370ms cubic-bezier(0.25,0.46,0.45,0.94), opacity 370ms",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`${upcomingEvent.title} photo ${i + 1}`} className="w-full block" draggable={false} />
          </div>
        );
      })}

      <div
        className="absolute bg-black/50 text-white text-xs px-3 py-1 rounded-full pointer-events-none backdrop-blur-sm"
        style={{ zIndex: count + 1, right: (count - 1) * OFFSET + 12, bottom: (count - 1) * OFFSET + 12 }}
      >
        {topIndex + 1} / {count} · drag or tap
      </div>
    </div>
  );
}

export default function UpcomingEventPage() {
  if (!upcomingEvent.ENABLED) return notFound();

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-[#001049] py-14 px-6 text-center">
        <p className="text-[#FFCA3A] text-sm font-semibold uppercase tracking-widest mb-3">
          Upcoming Event
        </p>
        <h1
          className="text-white font-bold leading-tight mb-5"
          style={{ fontFamily: "Syne-Bold, sans-serif", fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
        >
          {upcomingEvent.title}
        </h1>
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-white/60 text-sm">
          <span>📅 {upcomingEvent.date}</span>
          <span>🕘 {upcomingEvent.time}</span>
          <span>📍 {upcomingEvent.location}</span>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-6xl mx-auto px-6 py-16 flex flex-col lg:flex-row gap-20 items-start">

        {/* Card deck column — sticky, wide enough to show the full stack spread */}
        <div className="w-full lg:w-[55%] shrink-0 lg:sticky lg:top-28">
          <CardDeck images={upcomingEvent.images} />
        </div>

        {/* Details column */}
        <div className="w-full lg:w-[45%] flex flex-col gap-8 pt-4">
          <div>
            <h2
              className="text-[#001049] font-bold mb-4"
              style={{ fontFamily: "Syne-Bold, sans-serif", fontSize: "clamp(1.5rem, 2.5vw, 2rem)" }}
            >
              About the Event
            </h2>
            <p className="text-gray-500 leading-relaxed text-base">
              {upcomingEvent.subtitle}
            </p>
          </div>

          <div className="border-t border-gray-100 pt-6 flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <span className="text-2xl w-8 text-center">📅</span>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-0.5">Date</p>
                <p className="font-semibold text-[#001049]">{upcomingEvent.date}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-2xl w-8 text-center">🕘</span>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-0.5">Time</p>
                <p className="font-semibold text-[#001049]">{upcomingEvent.time}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-2xl w-8 text-center">📍</span>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-0.5">Location</p>
                <p className="font-semibold text-[#001049]">{upcomingEvent.location}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <a
              href={upcomingEvent.registrationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-[#001049] text-white font-bold rounded-2xl px-8 py-4 text-base hover:bg-[#FFCA3A] hover:text-[#001049] transition-colors duration-200 w-full text-center"
            >
              Register Now →
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
