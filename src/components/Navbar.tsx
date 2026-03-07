"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

function SlideButton({ href, className, fillColor, hoverTextColor, children }: {
  href: string;
  className: string;
  fillColor: string;
  hoverTextColor: string;
  children: React.ReactNode;
}) {
  const [state, setState] = useState<"idle" | "in" | "out">("idle");

  const handleMouseEnter = () => setState("in");
  const handleMouseLeave = () => {
    setState("out");
    setTimeout(() => setState("idle"), 300);
  };

  const translate =
    state === "idle" ? "-translate-x-full" :
    state === "in"   ? "translate-x-0" :
                       "translate-x-full";

  return (
    <Link
      href={href}
      className={`relative overflow-hidden ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span
        className={`absolute inset-0 ease-in-out ${translate} ${state === "idle" ? "duration-0" : "transition-transform duration-300"}`}
        style={{ backgroundColor: fillColor }}
      />
      <span
        className="relative transition-colors duration-150"
        style={{ color: state === "in" ? hoverTextColor : undefined }}
      >
        {children}
      </span>
    </Link>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { name: "Home", to: "/" },
    { name: "Programs", to: "/programs" },
    { name: "Team", to: "/team" },
    { name: "Blog", to: "/blog" },
  ];

  return (
    <header className={`sticky top-0 z-50 transition-all bg-[#001049] ${scrolled ? "bg-opacity-90 backdrop-blur" : ""}`}>
      <div
        className="flex justify-between items-center"
        style={{
          padding: "clamp(0.75rem, 2vw, 1.5rem) clamp(1rem, 4vw, 3.5rem)",
        }}
      >
        <Link href="/" className="flex items-center text-white no-underline min-w-0 shrink" style={{ gap: "clamp(0.5rem, 1vw, 1rem)" }}>
          <img src="/header-logo.svg" alt="AMSA Logo" className="w-auto shrink-0" style={{ height: "clamp(2rem, 4vw, 3.5rem)" }} />
          <p className="leading-tight hidden md:block" style={{ fontSize: "clamp(0.75rem, 1.2vw, 1.25rem)" }}>
            Association of Mongolian <br /> Students in America
          </p>
        </Link>

        <div className="xl:hidden text-white cursor-pointer" style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)" }} onClick={() => setOpen(!open)}>
          ☰
        </div>

        <nav className={`flex-col xl:flex xl:flex-row xl:items-center gap-5 absolute xl:static right-0 bg-[#001049] xl:bg-transparent px-6 py-4 xl:p-0 shadow-md xl:shadow-none w-full xl:w-auto transition-all ${open ? "flex" : "hidden"}`}
          style={{ top: "100%", gap: "clamp(1rem, 2vw, 2.5rem)" } as React.CSSProperties}
        >
          {navItems.map(({ name, to }) => (
            <Link
              key={name}
              href={to}
              className="text-white relative after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:bg-[#FFCA3A] after:w-0 hover:after:w-full after:transition-all"
              style={{ fontSize: "clamp(0.75rem, 1.2vw, 1.25rem)" }}
            >
              {name}
            </Link>
          ))}
          <div className="flex flex-col xl:flex-row" style={{ gap: "clamp(0.5rem, 1vw, 1.5rem)" }}>
            <SlideButton
              href="/signup/member"
              className="border-2 border-[#ffc832] text-[#ffc832] rounded-2xl text-center"
              fillColor="#ffc832"
              hoverTextColor="#001049"
            >
              <span style={{ fontSize: "clamp(0.75rem, 1.2vw, 1.25rem)", padding: "clamp(0.25rem, 0.5vw, 0.625rem) clamp(0.75rem, 1.5vw, 1.75rem)", display: "block" }}>Become a Member</span>
            </SlideButton>
            <SlideButton
              href="/login"
              className="border-2 border-white text-white rounded-2xl text-center"
              fillColor="#ffffff"
              hoverTextColor="#001049"
            >
              <span style={{ fontSize: "clamp(0.75rem, 1.2vw, 1.25rem)", padding: "clamp(0.25rem, 0.5vw, 0.625rem) clamp(0.75rem, 1.5vw, 1.75rem)", display: "block" }}>Login</span>
            </SlideButton>
          </div>
        </nav>
      </div>
    </header>
  );
}
