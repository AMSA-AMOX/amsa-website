"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import AOS from "aos";
import "aos/dist/aos.css";

const teamMembers = [
  { name: "Marla", image: "/team/marla.svg", linkedin: "https://www.linkedin.com/in/marla-munkhsaikhan-455141286/" },
  { name: "Tiffany", image: "/team/tiffany.svg", linkedin: "https://www.linkedin.com/in/tiffany-sanchir-272269298/" },
  { name: "Telmen", image: "/team/telmen.svg", linkedin: "https://linkedin.com/in/telmenbayarbaatar" },
  { name: "Nomiko", image: "/team/nomiko.svg", linkedin: "https://www.linkedin.com/in/nominsuvd-munkhbayar-9655a220b/" },
  { name: "Alex", image: "/team/alex.svg", linkedin: "https://www.linkedin.com/in/queguiner/" },
  { name: "Ozi", image: "/team/ozi.svg", linkedin: "https://www.linkedin.com/in/ozi-erdenebat-12b0ab2b0/" },
  { name: "Bilgee", image: "/team/bilgee.svg", linkedin: "https://www.linkedin.com/in/bilgeeb/" },
  { name: "Arvin", image: "/team/arvin.svg", linkedin: "https://www.linkedin.com/in/arvin-ariunbat-558a3b391/" },
];

const strategyBoardMembers = [
  { name: "Sukhbat", role: "chairman", image: "https://eaylfdrxudujbzcchhcp.supabase.co/storage/v1/object/public/pictures/public/sukhbat.jpeg", linkedin: "https://www.linkedin.com/in/sukhbatl/" },
  { name: "Khaliun", role: "director", image: "https://eaylfdrxudujbzcchhcp.supabase.co/storage/v1/object/public/pictures/public/1553998609060-haliunaa.jpg", linkedin: "https://www.linkedin.com/in/khal/" },
  { name: "Anudari", role: "secretary", image: "https://eaylfdrxudujbzcchhcp.supabase.co/storage/v1/object/public/pictures/public/1559570281982-31682479_10216797849442645_1569596713151234048_o.jpg", linkedin: "https://www.linkedin.com/in/letianu/" },
  { name: "Tsenguun", role: "director", image: "https://eaylfdrxudujbzcchhcp.supabase.co/storage/v1/object/public/pictures/public/tsenguun.jpeg", linkedin: "https://www.linkedin.com/in/tsenguun-ts/" },
];

export type TeamMemberInfo = {
  UserId: number;
  name: string;
  year: number;
  role: string;
  User: {
    firstName: string;
    lastName: string;
    email: string;
    schoolName: string;
    profilePic: string;
    linkedin: string;
  };
};

const HistoricalMemberCard = ({ member }: { member: TeamMemberInfo }) => {
  const name = member.User?.firstName || "";
  const profilePic = member.User?.profilePic || "/avatar.png";

  return (
    <div
      data-aos="fade-up"
      className="flex flex-col items-center"
    >
      <div className="w-56 overflow-hidden border-[12px] border-white mb-3 bg-white">
        <div className="h-68 overflow-hidden mb-2">
          <Image
            src={profilePic.startsWith("http") ? profilePic : "/avatar.png"}
            alt={name}
            width={208}
            height={272}
            className="object-cover w-full h-full"
            unoptimized
          />
        </div>
        <div className="px-3 py-2 text-center">
          <h3 className="text-[#111111] text-2xl leading-tight mb-0.5" style={{ fontFamily: "var(--font-ysabeau-sc)" }}>{name}</h3>
          <p className="text-[#8A8A8A] text-sm lowercase" style={{ fontFamily: "var(--font-ysabeau-sc)" }}>{member.name}</p>
        </div>
      </div>
    </div>
  );
};

const TeamSection = () => {
  const [historicalMembers, setHistoricalMembers] = useState<Record<string, TeamMemberInfo[]> | null>(null);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);

  useEffect(() => {
    AOS.init({ duration: 800, once: true });
    const fetchHistoricalMembers = async () => {
      try {
        const response = await fetch("/api/user/members");
        if (response.ok) {
          const data = await response.json();
          setHistoricalMembers(data.tuz || {});
        }
      } catch (err) {
        console.error("Error fetching historical team members:", err);
      }
    };

    fetchHistoricalMembers();
  }, []);

  const currentYear = new Date().getFullYear();
  const historicalYears = historicalMembers
    ? Object.keys(historicalMembers).filter((year) => parseInt(year) !== currentYear && parseInt(year) !== currentYear + 1)
    : [];

  return (
    <div className="w-full bg-[#001049] font-poppins">

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <div className="relative w-full h-[75vh] min-h-[420px] max-h-[820px]">
        <Image
          src="/teampage-hero.jpg"
          alt="AMSA Team"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/30" />

        {/* Text box — bottom-left */}
        <div className="absolute bottom-0 left-0 w-full md:w-auto">
          <div
            className="bg-[#001049] px-8 py-8 md:px-12 md:py-10 max-w-2xl"
            data-aos="fade-up"
          >
            <p className="text-[#FFCA3A] text-xs font-semibold uppercase tracking-widest mb-3">Our People</p>
            <h1 className="font-['Syne-Bold'] text-white text-2xl sm:text-3xl md:text-4xl leading-snug mb-4">
              A team {" "}
              <em className="italic text-[#FFCA3A]">committed</em>{" "}
              to the generations to come.
            </h1>
            <p className="text-white/70 text-sm md:text-base leading-relaxed max-w-md">
              We bring students together across campuses to create a supportive nonprofit network focused on shared growth, academic excellence, and career readiness.
            </p>
          </div>
        </div>
      </div>

      {/* ── Strategy Board ───────────────────────────────────────────────────── */}
      <section className="py-16 px-6">
        <h2
          className="font-['Syne-Bold'] text-white text-center mb-10 leading-[1.4]"
          data-aos="fade-up"
        >
          <span className="block text-xl sm:text-3xl md:text-3xl">Strategy Board</span>
        </h2>

        {/* Desktop */}
        <div className="hidden md:flex justify-center gap-x-12 gap-y-8 max-w-7xl mx-auto flex-wrap">
          {strategyBoardMembers.map((member, index) => (
            <a
              key={member.name}
              href={member.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              data-aos="fade-up"
              data-aos-delay={index * 80}
              className="flex flex-col items-center hover:-translate-y-2 transition-transform duration-300"
            >
              <div className="w-64 overflow-hidden border-[8px] lg:border-[10px] xl:border-[12px] border-white mb-4 bg-white">
                <div className="h-[300px] overflow-hidden mt-2 mb-2 mx-2">
                  <Image
                    src={member.image}
                    alt={member.name}
                    width={256}
                    height={300}
                    className="object-cover object-top w-full h-full"
                    unoptimized
                  />
                </div>
                <div className="px-3 py-1.5 text-center">
                  <h3 className="text-[#111111] text-4xl" style={{ fontFamily: "var(--font-ysabeau-sc)" }}>{member.name}</h3>
                  <p className="text-[#8A8A8A] font-medium text-lg" style={{ fontFamily: "var(--font-ysabeau-sc)" }}>{member.role}</p>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Mobile */}
        <div className="md:hidden overflow-x-auto scrollbar-hide">
          <div className="flex gap-8 w-max px-6 pb-4">
            {strategyBoardMembers.map((member, index) => (
              <a
                key={member.name}
                href={member.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                data-aos="fade-left"
                data-aos-delay={index * 50}
                className="flex flex-col items-center flex-shrink-0"
              >
                <div className="w-[142px] overflow-hidden border-[6px] sm:border-[8px] border-white mb-3 bg-white">
                  <div className="h-[164px] overflow-hidden mt-1.5 mb-1.5 mx-1.5">
                    <Image
                      src={member.image}
                      alt={member.name}
                      width={126}
                      height={164}
                      className="object-cover object-top w-full h-full"
                      unoptimized
                    />
                  </div>
                  <div className="px-2 py-1 text-center">
                    <h3 className="text-[#111111] font-bold text-xl" style={{ fontFamily: "var(--font-ysabeau-sc)" }}>{member.name}</h3>
                    <p className="text-[#8A8A8A] text-sm" style={{ fontFamily: "var(--font-ysabeau-sc)" }}>{member.role}</p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Executive Board ──────────────────────────────────────────────────── */}
      <section className="pb-20 px-6">
        <h2
          className="font-['Syne-Bold'] text-white text-center mb-12 leading-[1.4]"
          data-aos="fade-up"
        >
          <span className="block text-xl sm:text-3xl md:text-4xl">Executive Board</span>
          <span className="block text-base sm:text-3xl md:text-4xl text-[#FFCA3A]">2026 ~ 2027</span>
        </h2>

        {/* Desktop: 4-column grid */}
        <div className="hidden md:grid grid-cols-4 gap-x-6 gap-y-8 max-w-7xl mx-auto">
          {teamMembers.map((member, index) => (
            <a
              key={member.name}
              href={member.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              data-aos="fade-up"
              data-aos-delay={index < 4 ? index * 80 : (index - 4) * 80}
              className="flex items-center justify-center hover:-translate-y-2 transition-transform duration-300"
            >
              <Image src={member.image} alt={member.name} width={240} height={240} />
            </a>
          ))}
        </div>

        {/* Mobile: horizontal scroll */}
        <div className="md:hidden overflow-x-auto scrollbar-hide">
          <div className="flex gap-10 w-max px-2 pb-4">
            {teamMembers.map((member, index) => (
              <a
                key={member.name}
                href={member.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                data-aos="fade-left"
                data-aos-delay={index * 50}
                className="flex-shrink-0"
              >
                <Image src={member.image} alt={member.name} width={180} height={180} />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Past Cohorts ─────────────────────────────────────────────────────── */}
      {historicalYears.length > 0 && (
        <section className="pb-24 max-w-7xl mx-auto px-6">
          <h2
            className="font-['Syne-Bold'] text-white text-center mb-12 leading-[1.4]"
            data-aos="fade-up"
          >
            <span className="block text-xl sm:text-3xl md:text-3xl">Past Cohorts</span>
          </h2>

          <div className="flex flex-col items-center mb-12" data-aos="fade-up">
            <label htmlFor="year-select" className="block text-sm font-medium text-white/80 mb-3">
              Select a year to view past Executive Team members:
            </label>
            <select
              id="year-select"
              value={selectedYear || ""}
              onChange={(e) => setSelectedYear(e.target.value || null)}
              className="px-6 py-3 border-2 border-[#FFCA3A] bg-[#001049] text-white rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-[#FFCA3A] focus:border-[#FFCA3A] text-base w-full max-w-sm appearance-none cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23FFCA3A'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 1rem center",
                backgroundSize: "1.5em 1.5em",
                paddingRight: "3rem",
              }}
            >
              <option value="" className="bg-[#001049] text-white">-- Select a year --</option>
              {historicalYears
                .sort((a, b) => parseInt(b) - parseInt(a))
                .map((year) => (
                  <option key={year} value={year} className="bg-[#001049] text-white">
                    {year} ~ {parseInt(year) + 1}
                  </option>
                ))}
            </select>
          </div>

          {selectedYear && historicalMembers?.[selectedYear] && (
            <div className="mb-12">
              <h3 className="text-[#FFCA3A] text-xl md:text-2xl font-bold mb-8 text-center" data-aos="fade-up">
                Executive Team {selectedYear} ~ {parseInt(selectedYear) + 1}
              </h3>
              <div className="flex flex-wrap justify-center gap-x-10 gap-y-14">
                {historicalMembers[selectedYear].map((member, index) => (
                  <HistoricalMemberCard key={`historical-${selectedYear}-${index}`} member={member} />
                ))}
              </div>
            </div>
          )}

          {!selectedYear && (
            <div className="text-center pb-8 text-white/60" data-aos="fade-up">
              <p>Select a year from the dropdown above to view past Executive Team members.</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default TeamSection;
