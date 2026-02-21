"use client";

import React, { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

const programs = [
  {
    title: "Annual General Meeting (AGM)",
    short: "AGM",
    image: "/assets/Hero-alt1.png",
    description: `AGM is a two-day members-only conference held during Thanksgiving break. It rotates across U.S. colleges, helping AMSA members network and grow. Since the first AGM at MIT/Harvard in 2012, we've visited NYU, UChicago, Georgia Tech, UC Berkeley, and more—including virtual during COVID-19. It's a space for learning, bonding, and sharing.`,
  },
  {
    title: "Change Your Future (CYF)",
    short: "CYF",
    image: "/assets/programs/CYF.png",
    description: `CYF is a one-day annual leadership and college-readiness conference organized for high school students in Mongolia. The event inspires youth to pursue education abroad, with workshops, panel discussions, and mentorship. Participants meet students who've received scholarships from U.S. universities.`,
  },
  {
    title: "Global Mind Mentorship",
    short: "Global Mind",
    image: "/assets/programs/GlobalMind.png",
    description: `This 8-month mentorship program pairs industry professionals with college students in the U.S., who in turn guide Mongolian high school students on applying to U.S. schools. With monthly sessions, career support, and webinars, it builds a learning bridge across generations.`,
  },
  {
    title: "Best University Opportunity Program (BUOP)",
    short: "BUOP",
    image: "/assets/programs/BUOP.png",
    description: `BUOP empowers college students with personal and professional development workshops. The sessions cover time management, resume writing, career paths, mental health, and more—run by professionals and mentors across the AMSA network.`,
  },
  {
    title: "Temege Campaign",
    short: "Temege",
    image: "/assets/programs/Temege.png",
    description: `Since 2011, the Association of Mongolian Students in America has been organizing the "Best University Opportunity Program - BUOP" to reach and share our success stories with students in Mongolia. We are aware of how some people think only the wealthy go to the U.S for college, and we do not deny it as a misconception, either. This is why we are doing this fundraising campaign: to raise funds, helping underprivileged children fulfill their dreams and study at top universities in the US. Your support will help us lower the price of the tax to host more inclusive events open to the general public.`,
  },
  {
    title: "Curiosity Corner",
    short: "Curiosity Corner",
    image: "/assets/programs/CuriosityCorner.png",
    description: `This online interview series runs during the college application season. Weekly episodes on YouTube, Spotify, and Instagram feature Mongolian students studying abroad. They share stories, challenges, and advice—building inspiration and a sense of community.`,
  },
];

export default function ProgramsPage() {
  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);

  return (
    <section className="py-16 px-4 bg-[#FFFCF3] text-center font-poppins">
      <h2 className="text-2xl md:text-3xl font-['Syne-Bold'] text-[#001A78] mb-12 leading-relaxed">
        Since 2011, we've contributed to many impactful projects. <br />
        Our core initiatives include
        <span className="text-[#D62828] mx-1">AGM</span>,
        <span className="text-[#D62828] mx-1">BUOP</span>, and
        <span className="text-[#D62828] mx-1">CYF</span>.
      </h2>

      <div className="flex flex-col gap-12 max-w-5xl mx-auto">
        {programs.map((program, index) => (
          <div
            key={index}
            data-aos="fade-up"
            className="flex flex-col md:flex-row items-center gap-6 bg-white p-6 rounded-2xl shadow-md hover:bg-[#e7f1ff] transition duration-300"
          >
            <img
              src={program.image}
              alt={program.title}
              className="w-full md:w-[300px] rounded-xl object-cover"
            />
            <div className="text-left md:text-left flex-1">
              <h3 className="text-xl font-['Syne-Bold'] text-[#001A78] mb-2">{program.title}</h3>
              <hr className="border-t border-[#001A78] mb-3 w-12" />
              <p className="text-[#333] text-sm leading-relaxed">{program.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
