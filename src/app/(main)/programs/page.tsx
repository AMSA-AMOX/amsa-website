"use client";

import React, { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

const programs = [
  {
    title: "Annual General Meeting",
    short: "AGM",
    image: "/assets/Hero-alt1.png",
    componentShiftClass: "md:translate-x-10",
    cardSide: "left",
    description: `AGM is a two-day members-only conference held during Thanksgiving break. It rotates across U.S. colleges, helping AMSA members network and grow. Since the first AGM at MIT/Harvard in 2012, we've visited NYU, UChicago, Georgia Tech, UC Berkeley, and more—including virtual during COVID-19. It's a space for learning, bonding, and sharing.`,
    date: "Nov 27-29",
    location: "TBD, USA",
  },
  {
    title: "Change Your Future",
    short: "CYF",
    image: "/assets/programs/cyf2025.jpg",
    componentShiftClass: "md:-translate-x-10",
    cardSide: "right",
    description: `CYF is a one-day annual leadership and college-readiness conference organized for high school students in Mongolia. The event inspires youth to pursue education abroad, with workshops, panel discussions, and mentorship. Participants meet students who've received scholarships from U.S. universities.`,
    date: "TBD",
    location: "Ulaanbaatar",
  },
  {
    title: "Best University Opportunity Program",
    short: "BUOP",
    image: "/assets/programs/BUOP.png",
    componentShiftClass: "md:-translate-x-8",
    cardSide: "left",
    description: `BUOP empowers college students with personal and professional development workshops. The sessions cover time management, resume writing, career paths, mental health, and more—run by professionals and mentors across the AMSA network.`,
    date: "TBD",
    location: "Mongolia",
  },
  {
    title: "Temege Campaign",
    short: "TEMEGE",
    image: "/assets/programs/Temege.png",
    componentShiftClass: "md:translate-x-12",
    cardSide: "right",
    description: `Since 2011, the Association of Mongolian Students in America has been organizing the "Best University Opportunity Program - BUOP" to reach and share our success stories with students in Mongolia. We are aware of how some people think only the wealthy go to the U.S for college, and we do not deny it as a misconception, either. This is why we are doing this fundraising campaign: to raise funds, helping underprivileged children fulfill their dreams and study at top universities in the US. Your support will help us lower the price of the tax to host more inclusive events open to the general public.`,
    date: "Ongoing",
    location: "Nationwide",
  },
  {
  title: "Global Mind Mentorship",
  short: "GMM",
  image: "/assets/programs/GlobalMind.png",
  componentShiftClass: "md:translate-x-8",
  cardSide: "left",
  description: `This 8-month mentorship program pairs industry professionals with college students in the U.S., who in turn guide Mongolian high school students on applying to U.S. schools. With monthly sessions, career support, and webinars, it builds a learning bridge across generations.`,
  date: "8 Months",
  location: "Online",
  },
  {
    title: "Curiosity Corner",
    short: "CCorner",
    image: "/assets/programs/CuriosityCorner.png",
    componentShiftClass: "md:-translate-x-12",
    cardSide: "right",
    description: `This online interview series runs during the college application season. Weekly episodes on YouTube, Spotify, and Instagram feature Mongolian students studying abroad. They share stories, challenges, and advice—building inspiration and a sense of community.`,
    date: "Weekly",
    location: "Online",
  },
];

export default function ProgramsPage() {
  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);

  return (
    <section className="py-16 md:py-20 px-4 bg-[#001049] text-center font-poppins">
      <h2 className="text-2xl md:text-3xl font-['Syne-Bold'] text-white mb-12 md:mb-16 leading-relaxed">
        Since 2011, we've contributed to many impactful projects. <br />
        Our core initiatives include
        <span className="text-[#D62828] mx-1">AGM</span>,
        <span className="text-[#D62828] mx-1">BUOP</span>, and
        <span className="text-[#D62828] mx-1">CYF</span>.
      </h2>

      <div className="flex flex-col gap-16 md:gap-24 max-w-6xl mx-auto">
        {programs.map((program, index) => (
          <div
            key={index}
            data-aos="fade-up"
            className={`relative w-full transition-transform ${program.componentShiftClass}`}
          >
            <div className="relative overflow-hidden rounded-[22px] shadow-2xl h-[260px] md:h-[520px]">
              <img
                src={program.image}
                alt={program.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div
              className={`relative -mt-10 mx-4 md:mx-0 md:absolute md:-bottom-16 md:mt-0 w-auto md:w-[min(620px,calc(100%-2rem))] bg-[#EDEDED] rounded-[18px] px-5 py-5 md:px-7 md:py-6 text-left shadow-[0_12px_32px_rgba(0,0,0,0.28)] border border-black/10 ${
                program.cardSide === "right" ? "md:right-6" : "md:left-6"
              }`}
            >
              <p className="absolute left-5 top-2 md:left-7 md:top-3 text-[#AEB6C8] font-['Syne-Bold'] text-6xl md:text-8xl leading-none tracking-wide pointer-events-none select-none z-0 opacity-20">
                {program.short}
              </p>

              <div className="relative z-10 pt-9">
                <h3 className="text-[#0D0D0D] text-[30px] md:text-[clamp(2rem,3.2vw,3rem)] font-['Syne-Bold'] leading-[1.05] mb-3 break-words">
                  {program.title}
                </h3>
                <p className="text-[#222] text-xs md:text-[13px] leading-[1.5] mb-5">
                  {program.description.length > 300
                    ? `${program.description.slice(0, 300)}...`
                    : program.description}
                </p>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-[#101010]">
                  <p className="font-['Syne-Bold'] text-xl md:text-[30px] leading-none">{program.date}</p>
                  <div className="h-10 w-px bg-black/35" />
                  <div className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#C52A2A"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-7 h-7 md:w-9 md:h-9"
                      aria-hidden="true"
                    >
                      <path d="M21 10.5c0 6.2-9 12.5-9 12.5s-9-6.3-9-12.5a9 9 0 1 1 18 0Z" />
                      <circle cx="12" cy="10.5" r="3" />
                    </svg>
                    <p className="font-['Syne-Bold'] text-xl md:text-[30px] leading-none">{program.location}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
