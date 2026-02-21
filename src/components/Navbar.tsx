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
      <div className="flex justify-between items-center px-10 py-4">
        <Link href="/" className="flex items-center gap-3 text-white no-underline shrink-0">
          <img src="/header-logo.svg" alt="AMSA Logo" className="h-12 w-auto" />
          <p className={"text-lg font-medium leading-tight"}>
            Association of Mongolian <br /> Students in America
          </p>
        </Link>

        <div className="text-3xl md:hidden text-white cursor-pointer" onClick={() => setOpen(!open)}>
          ☰
        </div>

        <nav className={`flex-col md:flex md:flex-row md:items-center md:gap-12 gap-5 absolute md:static top-20 right-0 bg-[#001049] md:bg-transparent px-6 py-4 md:p-0 shadow-md md:shadow-none w-full md:w-auto transition-all ${open ? "flex" : "hidden"}`}>
          {navItems.map(({ name, to }) => (
            <Link
              key={name}
              href={to}
              className="text-white text-lg hover:text-[#ffc832] relative after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:bg-[#FFCA3A] after:w-0 hover:after:w-full after:transition-all"
            >
              {name}
            </Link>
          ))}
          <div className="flex flex-col md:flex-row gap-6">
            <SlideButton
              href="https://www.gofundme.com/f/amsa-general-fundraising-campaign-2024?utm_campaign=p_lico+share-sheet&utm_medium=copy_link&utm_source=customer"
              className="border-2 border-[#ffc832] text-[#ffc832] text-lg px-6 py-2 rounded-md text-center"
              fillColor="#ffc832"
              hoverTextColor="#001049"
            >
              Donate
            </SlideButton>
            <SlideButton
              href="/login"
              className="border-2 border-white text-white text-lg px-6 py-2 rounded-md text-center"
              fillColor="#ffffff"
              hoverTextColor="#001049"
            >
              Login
            </SlideButton>
          </div>
        </nav>
      </div>
    </header>
  );
}
