"use client";

import { useState } from "react";

type Position = {
  id: number;
  title: string;
  type: string;
  location: string;
  shortDesc: string;
  description: string;
  responsibilities: string[];
  qualifications: string[];
  applyUrl: string;
};

const positions: Position[] = [
  {
    id: 1,
    title: "Project Manager Intern",
    type: "Internship",
    location: "Remote",
    shortDesc: "Drive AMSA's initiatives forward by coordinating teams, timelines, and deliverables across our programs.",
    description:
      "As a Project Manager Intern, you'll work directly with AMSA leadership to plan, coordinate, and deliver key organizational initiatives. You'll keep cross-functional teams aligned, remove blockers, and ensure projects ship on time.",
    responsibilities: [
      "Own the end-to-end coordination of 2–3 concurrent AMSA projects",
      "Facilitate weekly check-ins and maintain project timelines",
      "Draft project briefs, status updates, and post-mortems",
      "Identify risks early and escalate to leadership when needed",
      "Maintain shared documentation and task-tracking systems",
    ],
    qualifications: [
      "Strong organizational and communication skills",
      "Experience with project management tools (Notion, Asana, Linear, etc.)",
      "Comfortable working across time zones in a remote-first environment",
      "Available to commit ~6–10 hours/week",
    ],
    applyUrl: "https://forms.google.com/",
  },
  {
    id: 2,
    title: "Marketing Intern",
    type: "Internship",
    location: "Remote",
    shortDesc: "Shape AMSA's brand voice and grow our community presence across digital channels.",
    description:
      "The Marketing Intern will help develop and execute campaigns that connect Mongolian students across America. You'll create content, manage social media, and analyze performance to continuously improve AMSA's reach and impact.",
    responsibilities: [
      "Build and manage a monthly content calendar for Instagram, LinkedIn, and other platforms",
      "Design graphics and short-form video content using Canva or Figma",
      "Write copy for newsletters, event promotions, and announcements",
      "Track engagement metrics and report insights to the team",
      "Support event promotion and fundraising campaign launches",
    ],
    qualifications: [
      "Proficient in Canva, Figma, or Adobe Creative Suite",
      "Strong written English; Mongolian language skills are a plus",
      "Understanding of social media best practices and trends",
      "Creative, detail-oriented, and self-motivated",
    ],
    applyUrl: "https://forms.google.com/",
  },
  {
    id: 3,
    title: "Public Relations Intern",
    type: "Internship",
    location: "Remote",
    shortDesc: "Represent AMSA externally and build the relationships that expand our community's reach.",
    description:
      "As a Public Relations Intern, you'll be AMSA's external voice — building partnerships with universities, student organizations, and media outlets. You'll craft press materials, manage outreach, and help AMSA grow its reputation as a leading Mongolian student organization in America.",
    responsibilities: [
      "Identify and reach out to partner universities, clubs, and media outlets",
      "Draft press releases, partnership decks, and sponsorship proposals",
      "Manage an outreach pipeline and track follow-ups",
      "Represent AMSA at virtual networking events and info sessions",
      "Collaborate with the marketing team on external-facing campaigns",
    ],
    qualifications: [
      "Excellent written and verbal communication skills",
      "Interest in PR, communications, or nonprofit development",
      "Professional, proactive, and comfortable with cold outreach",
      "Experience in a student organization or community role is a plus",
    ],
    applyUrl: "https://forms.google.com/",
  },
  {
    id: 4,
    title: "Software Engineer Intern",
    type: "Internship",
    location: "Remote",
    shortDesc: "Build the platform that powers the Mongolian student community across America.",
    description:
      "As a Software Engineer Intern, you'll contribute to the development of AMSA's Next.js web platform. You'll ship real features used by members nationwide, work through code reviews, and gain hands-on experience in a modern full-stack TypeScript stack.",
    responsibilities: [
      "Build and ship new features for the AMSA website (Next.js, TypeScript, Tailwind CSS)",
      "Fix bugs and improve existing UI/UX based on member feedback",
      "Participate in code reviews and technical planning discussions",
      "Write clean, maintainable code with an eye for performance and accessibility",
      "Collaborate asynchronously with a distributed team",
    ],
    qualifications: [
      "Proficient in React and TypeScript",
      "Familiarity with Tailwind CSS and REST APIs",
      "Basic understanding of Git and collaborative development workflows",
      "Experience with Next.js or a similar framework is a strong plus",
    ],
    applyUrl: "https://forms.google.com/",
  },
];

function PositionCard({ position, index }: { position: Position; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`border-b border-white/10 last:border-0 transition-colors duration-200 ${open ? "bg-white/5" : "hover:bg-white/[0.03]"}`}
    >
      {/* Header */}
      <button
        className="w-full text-left px-10 py-8 flex items-center justify-between gap-6"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div className="flex items-center gap-8 flex-1 min-w-0">
          <span className="text-white/20 font-['Syne-Bold'] text-4xl select-none w-10 shrink-0">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="font-['Syne-Bold'] text-2xl text-white mb-1">
              {position.title}
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-[#FFCA3A] text-xs font-semibold uppercase tracking-widest">
                {position.type}
              </span>
              <span className="text-white/30 text-xs">·</span>
              <span className="text-white/50 text-xs">{position.location}</span>
            </div>
          </div>
          <p className="hidden lg:block text-white/50 text-sm max-w-xs leading-relaxed flex-shrink-0">
            {position.shortDesc}
          </p>
        </div>

        <span
          className={`shrink-0 text-white/40 transition-transform duration-300 ${open ? "rotate-45" : ""}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </span>
      </button>

      {/* Expanded body */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? "max-h-[900px] opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="px-10 pb-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Description */}
          <div className="lg:col-span-1 lg:pl-18" style={{ paddingLeft: "4.5rem" }}>
            <p className="text-white/60 text-sm leading-relaxed">{position.description}</p>
          </div>

          {/* Responsibilities */}
          <div>
            <h4 className="text-[#FFCA3A] text-xs font-semibold uppercase tracking-widest mb-4">
              Responsibilities
            </h4>
            <ul className="space-y-3">
              {position.responsibilities.map((r, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-white/70 leading-relaxed">
                  <span className="mt-2 shrink-0 w-1 h-1 rounded-full bg-[#FFCA3A]" />
                  {r}
                </li>
              ))}
            </ul>
          </div>

          {/* Qualifications + Apply */}
          <div>
            <h4 className="text-[#FFCA3A] text-xs font-semibold uppercase tracking-widest mb-4">
              What We&apos;re Looking For
            </h4>
            <ul className="space-y-3 mb-8">
              {position.qualifications.map((q, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-white/70 leading-relaxed">
                  <span className="mt-2 shrink-0 w-1 h-1 rounded-full bg-white/40" />
                  {q}
                </li>
              ))}
            </ul>

            <a
              href={position.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#FFCA3A] text-[#001049] text-sm font-bold px-6 py-3 rounded-xl hover:bg-yellow-300 transition-colors"
            >
              Apply now
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CareersPage() {
  return (
    <main className="min-h-screen bg-[#001049]">
      {/* Hero */}
      <div className="max-w-7xl mx-auto px-10 pt-24 pb-16">
        <p className="text-[#FFCA3A] text-xs font-semibold uppercase tracking-widest mb-5">
          Join the Team
        </p>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <h1 className="font-['Syne-Bold'] text-5xl md:text-7xl text-white leading-none">
            Open<br />Positions
          </h1>
          <p className="text-white/50 text-base max-w-sm leading-relaxed lg:text-right">
            All roles are internship positions open to current students and recent graduates. Fully remote.
          </p>
        </div>

        {/* Divider with count */}
        <div className="mt-14 flex items-center gap-4">
          <span className="text-white/30 text-sm">{positions.length} positions open</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>
      </div>

      {/* Positions list */}
      <div className="max-w-7xl mx-auto px-10">
        <div className="border border-white/10 rounded-2xl overflow-hidden">
          {positions.map((position, i) => (
            <PositionCard key={position.id} position={position} index={i} />
          ))}
        </div>
      </div>

    </main>
  );
}
