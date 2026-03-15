"use client";

import React from "react";
import Link from "next/link";
import { FaInstagram, FaFacebook, FaLinkedin } from "react-icons/fa";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Programs", href: "/programs" },
  { label: "Team", href: "/team" },
  { label: "Blog", href: "/blog" },
];

const socialLinks = [
  { icon: <FaInstagram />, href: "https://www.instagram.com/amsa.amokh/", label: "Instagram" },
  { icon: <FaFacebook />,  href: "https://www.facebook.com/amsa.amokh",  label: "Facebook"  },
  { icon: <FaLinkedin />,  href: "https://www.linkedin.com/company/association-of-mongolian-students-in-theusa/",  label: "LinkedIn"  },
];

const Footer = () => {
  return (
    <footer className="relative w-full text-[#FFFCF3] bg-[#001049] overflow-hidden">
      <img src="/assets/footerbg.svg" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover object-top" />

      <div className="relative z-10 px-6 md:px-10 xl:px-14 pt-20 pb-10">

        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-16">

          {/* Brand */}
          <div className="flex flex-col items-center md:items-start gap-5">
            <Link href="/" className="flex items-center text-white no-underline" style={{ gap: "clamp(0.5rem, 1vw, 1rem)" }}>
              <img src="/header-logo.svg" alt="AMSA" className="w-auto shrink-0" style={{ height: "clamp(2rem, 4vw, 3.5rem)" }} />
              <span className="leading-tight" style={{ fontSize: "clamp(0.75rem, 1.2vw, 1.25rem)" }}>
                Association of Mongolian<br />Students in America
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <div className="flex flex-col items-center md:items-start gap-4">
            <span className="uppercase tracking-widest text-[#FFCA3A] font-semibold" style={{ fontSize: "clamp(0.875rem, 1.4vw, 1.1rem)" }}>Navigate</span>
            {navLinks.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="text-[#FFFCF3]/80 hover:text-[#FFCA3A] transition-colors duration-200 font-medium"
                style={{ fontSize: "clamp(0.9rem, 1.4vw, 1.15rem)" }}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Get Involved */}
          <div className="flex flex-col items-center md:items-start gap-4">
            <span className="uppercase tracking-widest text-[#FFCA3A] font-semibold" style={{ fontSize: "clamp(0.875rem, 1.4vw, 1.1rem)" }}>Get Involved</span>
            <Link
              href="/signup/member"
              className="text-[#FFFCF3]/80 hover:text-[#FFCA3A] transition-colors duration-200 font-medium"
              style={{ fontSize: "clamp(0.9rem, 1.4vw, 1.15rem)" }}
            >
              Become a member
            </Link>
            <Link
              href="/donate"
              className="text-[#FFFCF3]/80 hover:text-[#FFCA3A] transition-colors duration-200 font-medium"
              style={{ fontSize: "clamp(0.9rem, 1.4vw, 1.15rem)" }}
            >
              Donate
            </Link>
          </div>

          {/* Contact */}
          <div className="flex flex-col items-center md:items-start gap-4">
            <span className="uppercase tracking-widest text-[#FFCA3A] font-semibold" style={{ fontSize: "clamp(0.875rem, 1.4vw, 1.1rem)" }}>Contact</span>
            <a
              href="mailto:administration@amsa.mn"
              className="inline-flex items-center gap-2 text-[#FFFCF3]/80 hover:text-[#FFCA3A] transition-colors duration-200 font-medium"
              style={{ fontSize: "clamp(0.9rem, 1.4vw, 1.15rem)" }}
            >
              administration@amsa.mn
            </a>
            <div className="flex gap-5 mt-1" style={{ fontSize: "clamp(1.1rem, 1.5vw, 1.4rem)" }}>
              {socialLinks.map(({ icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="text-[#FFFCF3]/60 hover:text-[#FFCA3A] transition-colors duration-200"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[#FFFCF3]/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[#FFFCF3]/40" style={{ fontSize: "clamp(0.65rem, 1vw, 0.875rem)" }}>
          <span>© {new Date().getFullYear()} AMSA. All rights reserved.</span>
          <span>Association of Mongolian Students in America</span>
        </div>

      </div>
    </footer>
  );
};

export default Footer;


