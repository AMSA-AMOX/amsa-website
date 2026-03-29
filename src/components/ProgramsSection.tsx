"use client";

import React, { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

const programs = [
  {
    short: "CYF",
    words: ["Change", "Your", "Future"],
    accent: "Leadership & College Readiness",
    description: "A one-day annual conference inspiring high school students in Mongolia to pursue higher education in the U.S.",
    location: "Ulaanbaatar, Mongolia",
    image: "/assets/programs/cyf2025.jpg",
  },
  {
    short: "BUOP",
    words: ["Best", "University", "Opportunity"],
    accent: "Scholarships & Mentorship",
    description: "Empowering 1600+ students over 10 years with workshops, mentorship, and U.S. university preparation.",
    location: "Ulaanbaatar, Mongolia",
    image: "/assets/programs/BUOP.png",
  },
  {
    short: "AGM",
    words: ["Annual", "General", "Meeting"],
    accent: "Networking & Growth",
    description: "Our flagship members-only conference rotating across top U.S. colleges every Thanksgiving break.",
    location: "United States",
    image: "/assets/programs/1.png",
  },
];

export default function ProgramsSection() {
  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);

  return (
    <section className="py-16 px-8 lg:px-14 bg-[#001049] font-poppins">
      {/* Header */}
      <div className="text-center mb-10">
        <h2 className="text-4xl font-['Syne-Bold'] text-white mb-2">Our Programs</h2>
      </div>

      {/* Bento grid: 3 cols, 2 rows
          Row 1: CYF text  | BUOP image | AGM text
          Row 2: CYF image | BUOP text  | AGM image */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[320px]">
        {[
          { type: "text",  program: programs[0], delay: 0   },
          { type: "image", program: programs[1], delay: 80  },
          { type: "text",  program: programs[2], delay: 160 },
          { type: "image", program: programs[0], delay: 60  },
          { type: "text",  program: programs[1], delay: 140 },
          { type: "image", program: programs[2], delay: 220 },
        ].map((cell, i) => {
          const { program } = cell;
          if (cell.type === "text") {
            return (
              <a
                key={i}
                href="/programs"
                data-aos="fade-up"
                data-aos-delay={cell.delay}
                className="bg-white rounded-2xl p-7 flex flex-col justify-between overflow-hidden relative group hover:bg-[#2a4480] transition-colors duration-300"
              >
                <span className="absolute -bottom-4 -right-3 text-[7rem] font-['Syne-Bold'] text-[#001049]/5 group-hover:text-white/5 leading-none select-none pointer-events-none transition-colors duration-300">
                  {program.short}
                </span>
                <div>
                  <span className="text-[11px] uppercase tracking-[0.2em] text-[#001049]/40 group-hover:text-white/40 font-semibold transition-colors duration-300">
                    {program.location}
                  </span>
                  <div className="mt-3">
                    {program.words.map((word, wi) => (
                      <p
                        key={wi}
                        className={`font-['Syne-Bold'] leading-none transition-colors duration-300 ${
                          wi === 1
                            ? "text-[#FFCA3A] italic text-3xl"
                            : "text-[#001049] group-hover:text-white text-3xl"
                        }`}
                      >
                        {word}
                      </p>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[#001049]/70 group-hover:text-white/60 text-lg leading-relaxed mb-4 line-clamp-3 transition-colors duration-300">
                    {program.description}
                  </p>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#001049]/60 group-hover:text-white/70 transition-colors duration-200">
                    Learn more
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </span>
                </div>
              </a>
            );
          }
          return (
            <div
              key={i}
              data-aos="fade-up"
              data-aos-delay={cell.delay}
              className="rounded-2xl overflow-hidden"
            >
              <img
                src={program.image}
                alt={program.short}
                className="w-full h-full object-cover"
              />
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div className="mt-10 flex justify-center">
        <a href="/programs" className="hero-cta">
          Explore All Programs
          <span className="icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </span>
        </a>
      </div>
    </section>
  );
}
