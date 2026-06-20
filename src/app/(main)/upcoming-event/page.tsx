"use client";

import { useState, useRef, useEffect } from "react";
import { notFound } from "next/navigation";
import upcomingEvent from "@/config/upcomingEvent";

const OFFSET = 24;
const DAMPEN = 0.45;
const SWIPE_THRESHOLD = 60;
const FLING_DISTANCE = 900;

function CardDeck({ images }: { images: string[] }) {
  const [topIndex, setTopIndex] = useState(0);
  const [isTouch, setIsTouch] = useState(false);
  useEffect(() => { setIsTouch(window.matchMedia("(pointer: coarse)").matches); }, []);
  const count = images.length;

  // ── Desktop drag state ──────────────────────────────────────────────────────
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isFlinging, setIsFlinging] = useState(false);
  const mouseStart = useRef<{ x: number; y: number } | null>(null);
  const isFlingRef = useRef(false); // ref so global listeners see current value

  // Attach global move/up while dragging so the card follows even outside bounds
  useEffect(() => {
    if (!isDragging) return;

    function onMove(e: MouseEvent) {
      if (!mouseStart.current || isFlingRef.current) return;
      setDragOffset({
        x: (e.clientX - mouseStart.current.x) * DAMPEN,
        y: (e.clientY - mouseStart.current.y) * DAMPEN,
      });
    }

    function onUp(e: MouseEvent) {
      if (!mouseStart.current) return;
      const rawDx = e.clientX - mouseStart.current.x;
      const rawDy = e.clientY - mouseStart.current.y;
      const rawDist = Math.hypot(rawDx, rawDy);
      mouseStart.current = null;
      setIsDragging(false);

      if (rawDist < 8) {
        // tap — advance immediately
        setDragOffset({ x: 0, y: 0 });
        setTopIndex((p) => (p + 1) % images.length);
      } else if (rawDist > SWIPE_THRESHOLD) {
        // fling off in drag direction then advance
        const angle = Math.atan2(rawDy, rawDx);
        const fling = { x: Math.cos(angle) * FLING_DISTANCE, y: Math.sin(angle) * FLING_DISTANCE };
        isFlingRef.current = true;
        setIsFlinging(true);
        setDragOffset(fling);
        setTimeout(() => {
          setTopIndex((p) => (p + 1) % images.length);
          setDragOffset({ x: 0, y: 0 });
          isFlingRef.current = false;
          setIsFlinging(false);
        }, 380);
      } else {
        // not far enough — snap back
        setDragOffset({ x: 0, y: 0 });
      }
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isDragging, images.length]);

  function onMouseDown(e: React.MouseEvent) {
    if (isFlinging) return;
    mouseStart.current = { x: e.clientX, y: e.clientY };
    setIsDragging(true);
    setDragOffset({ x: 0, y: 0 });
  }

  // ── Mobile tap state ────────────────────────────────────────────────────────
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  function onTouchStart(e: React.TouchEvent) {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    touchStart.current = null;
    // Only advance on genuine tap — ignore scroll/swipe gestures
    if (Math.abs(dx) < 15 && Math.abs(dy) < 15) {
      setTopIndex((p) => (p + 1) % count);
    }
  }

  // ── Shared ──────────────────────────────────────────────────────────────────
  function stackPos(i: number) {
    return (i - topIndex + count) % count;
  }

  const cardWidth = `calc(100% - ${(count - 1) * OFFSET}px)`;

  return (
    <div
      className="relative select-none"
      style={{ paddingRight: (count - 1) * OFFSET, paddingBottom: (count - 1) * OFFSET }}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Invisible spacer — natural image height, zero white bars */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={images[topIndex]} alt="" aria-hidden className="w-full block invisible" draggable={false} />

      {images.map((src, i) => {
        const pos = stackPos(i);
        const isTop = pos === 0;
        const extraX = isTop ? dragOffset.x : 0;
        const extraY = isTop ? dragOffset.y : 0;
        const extraRot = isTop ? Math.max(-15, Math.min(15, dragOffset.x * 0.06)) : 0;
        const noTransition = isDragging && !isFlinging;
        return (
          <div
            key={src}
            className="absolute top-0 left-0 rounded-2xl overflow-hidden"
            style={{
              width: cardWidth,
              transform: `translateX(${pos * OFFSET + extraX}px) translateY(${pos * OFFSET + extraY}px) rotate(${pos * 3 + extraRot}deg)`,
              zIndex: count - pos,
              opacity: pos > 3 ? 0 : 1,
              cursor: isTop ? (isDragging ? "grabbing" : "grab") : "default",
              boxShadow: isTop && isDragging ? "0 24px 60px rgba(0,0,0,0.35)" : "0 8px 30px rgba(0,0,0,0.18)",
              transition: noTransition ? "none" : "transform 370ms cubic-bezier(0.25,0.46,0.45,0.94), opacity 370ms, box-shadow 200ms",
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
        {topIndex + 1} / {count} · {isTouch ? "tap" : "drag or tap"}
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
          className="text-white font-bold mb-5"
          style={{ fontFamily: "Syne-Bold, sans-serif", fontSize: "clamp(2rem, 5vw, 3.5rem)", lineHeight: 1.18, paddingTop: "0.08em" }}
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
              style={{ fontFamily: "Syne-Bold, sans-serif", fontSize: "clamp(1.5rem, 2.5vw, 2rem)", lineHeight: 1.2, paddingTop: "0.08em" }}
            >
              About the Event
            </h2>
            <p className="text-gray-500 leading-relaxed text-base whitespace-pre-line">
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
