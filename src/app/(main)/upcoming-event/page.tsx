"use client";

import { useState } from "react";
import { notFound } from "next/navigation";
import upcomingEvent from "@/config/upcomingEvent";

const OFFSET = 24;         // px gap between stacked cards
const DRAG_DAMPEN = 0.45;  // card moves at 45% of pointer speed — feels resistant
const SWIPE_THRESHOLD = 60; // px (raw pointer) before a drag counts as a swipe
const FLING_DISTANCE = 900; // px the card travels when flung off

function CardDeck({ images }: { images: string[] }) {
  const [topIndex, setTopIndex] = useState(0);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isFlinging, setIsFlinging] = useState(false);
  const count = images.length;

  function stackPos(i: number) {
    return (i - topIndex + count) % count;
  }

  function advance() {
    setTopIndex((prev) => (prev + 1) % count);
  }

  function resetDrag() {
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
    setDragStart(null);
  }

  function onPointerDown(e: React.PointerEvent) {
    if (isFlinging) return;
    // Capture so move/up fire even if pointer leaves the element
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDragStart({ x: e.clientX, y: e.clientY });
    setIsDragging(true);
    setDragOffset({ x: 0, y: 0 });
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!isDragging || !dragStart || isFlinging) return;
    setDragOffset({
      x: (e.clientX - dragStart.x) * DRAG_DAMPEN,
      y: (e.clientY - dragStart.y) * DRAG_DAMPEN,
    });
  }

  function onPointerUp() {
    if (!isDragging || !dragStart) return;
    const { x: dx, y: dy } = dragOffset;
    const dist = Math.hypot(dx, dy);
    const isTap = dist < 8;

    if (isTap) {
      resetDrag();
      advance();
      return;
    }

    if (dist >= SWIPE_THRESHOLD) {
      // Fling the card off in the drag direction then advance
      const angle = Math.atan2(dy, dx);
      setIsDragging(false);
      setIsFlinging(true);
      setDragOffset({ x: Math.cos(angle) * FLING_DISTANCE, y: Math.sin(angle) * FLING_DISTANCE });
      setTimeout(() => {
        advance();
        setDragOffset({ x: 0, y: 0 });
        setDragStart(null);
        setIsFlinging(false);
      }, 380);
    } else {
      // Not far enough — snap back
      resetDrag();
    }
  }

  const cardWidth = `calc(100% - ${(count - 1) * OFFSET}px)`;

  return (
    <div
      className="relative select-none"
      style={{ paddingRight: (count - 1) * OFFSET, paddingBottom: (count - 1) * OFFSET }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={resetDrag}
    >
      {/* Invisible spacer — natural image height, zero white bars */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={images[topIndex]} alt="" aria-hidden className="w-full block invisible" draggable={false} />

      {images.map((src, i) => {
        const pos = stackPos(i);
        const isTop = pos === 0;
        const stackX = pos * OFFSET;
        const stackY = pos * OFFSET;
        const stackRot = pos * 3;

        // Live drag offset + tilt only on the top card
        const extraX = isTop ? dragOffset.x : 0;
        const extraY = isTop ? dragOffset.y : 0;
        // Tilt follows horizontal drag: max ~15deg
        const extraRot = isTop ? Math.max(-15, Math.min(15, dragOffset.x * 0.06)) : 0;

        // Shadow deepens while dragging to give a "lifted" feel
        const shadow = isTop && isDragging
          ? "0 24px 60px rgba(0,0,0,0.35)"
          : "0 8px 30px rgba(0,0,0,0.18)";

        // Disable transition while finger is moving; enable for snap-back & fling
        const transition = isDragging && !isFlinging
          ? "none"
          : "transform 370ms cubic-bezier(0.25,0.46,0.45,0.94), opacity 370ms, box-shadow 200ms";

        return (
          <div
            key={src}
            className="absolute top-0 left-0 rounded-2xl overflow-hidden"
            style={{
              width: cardWidth,
              transform: `translateX(${stackX + extraX}px) translateY(${stackY + extraY}px) rotate(${stackRot + extraRot}deg)`,
              zIndex: count - pos,
              opacity: pos > 3 ? 0 : 1,
              cursor: isTop ? (isDragging ? "grabbing" : "grab") : "default",
              boxShadow: shadow,
              transition,
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
