"use client";

import React from "react";
import Link from "next/link";
import { FaInstagram, FaEnvelope, FaFacebook, FaLinkedin } from "react-icons/fa";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Programs", href: "/programs" },
  { label: "Team", href: "/team" },
  { label: "Blog", href: "/blog" },
];

const socialLinks = [
  { icon: <FaInstagram />, href: "https://instagram.com", label: "Instagram" },
  { icon: <FaFacebook />,  href: "https://facebook.com",  label: "Facebook"  },
  { icon: <FaLinkedin />,  href: "https://linkedin.com",  label: "LinkedIn"  },
];

const Footer = () => {
  return (
    <footer className="relative w-full text-[#FFFCF3] bg-[#001049] overflow-hidden">
      <img src="/assets/footerbg.svg" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover object-top" />

      <div className="relative z-10 px-6 md:px-10 xl:px-14 pt-20 pb-10">

        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 mb-16">

          {/* Brand */}
          <div className="flex flex-col items-center md:items-start gap-5">
            <Link href="/" className="flex items-center gap-4">
              <img src="/header-logo.svg" alt="AMSA" className="h-16 w-auto" />
              <span className="font-['Syne-Bold'] text-xl leading-tight">
                Association of Mongolian<br />Students in America
              </span>
            </Link>
            <p className="text-[#FFFCF3]/60 text-base leading-relaxed text-center md:text-left max-w-xs">
              Empowering, supporting, and uniting the Mongolian student community across America.
            </p>
            <div className="flex gap-4 text-2xl">
              {socialLinks.map(({ icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="w-12 h-12 rounded-full border border-[#FFFCF3]/20 flex items-center justify-center hover:border-[#FFCA3A] hover:text-[#FFCA3A] transition-all duration-200"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex flex-col items-center md:items-start gap-5">
            <span className="font-['Syne-Bold'] text-sm uppercase tracking-widest text-[#FFCA3A]">Navigate</span>
            {navLinks.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="text-[#FFFCF3]/70 hover:text-[#FFCA3A] text-base transition-colors duration-200"
              >
                {label}
              </Link>
            ))}
          </div>

          {/* CTA */}
          <div className="flex flex-col items-center md:items-start gap-5">
            <span className="font-['Syne-Bold'] text-sm uppercase tracking-widest text-[#FFCA3A]">Get Involved</span>
            <p className="text-[#FFFCF3]/60 text-base leading-relaxed text-center md:text-left">
              Our Instagram is always online — fastest way to reach us.
            </p>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 border border-[#FFCA3A] text-[#FFCA3A] text-base px-6 py-3 rounded-full hover:bg-[#FFCA3A] hover:text-[#001049] transition-all duration-200"
            >
              <FaInstagram /> Follow us
            </a>
            <a
              href="https://www.gofundme.com/f/amsa-general-fundraising-campaign-2024"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 border border-[#FFFCF3]/30 text-[#FFFCF3]/70 text-base px-6 py-3 rounded-full hover:border-[#FFFCF3] hover:text-[#FFFCF3] transition-all duration-200"
            >
              Donate →
            </a>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[#FFFCF3]/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[#FFFCF3]/40">
          <span>© {new Date().getFullYear()} AMSA. All rights reserved.</span>
          <span>Association of Mongolian Students in America</span>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
