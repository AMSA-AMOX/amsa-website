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
  { name: "Sukhbat", role: "Chairman", image: "https://eaylfdrxudujbzcchhcp.supabase.co/storage/v1/object/public/pictures/public/sukhbat.jpeg", linkedin: "https://www.linkedin.com/in/sukhbatl/" },
  { name: "Khaliun", role: "Director", image: "https://eaylfdrxudujbzcchhcp.supabase.co/storage/v1/object/public/pictures/public/1553998609060-haliunaa.jpg", linkedin: "https://www.linkedin.com/in/khal/" },
  { name: "Anudari", role: "Secretary", image: "https://eaylfdrxudujbzcchhcp.supabase.co/storage/v1/object/public/pictures/public/1559570281982-31682479_10216797849442645_1569596713151234048_o.jpg", linkedin: "https://www.linkedin.com/in/letianu/" },
  { name: "Tsenguun", role: "Director", image: "https://eaylfdrxudujbzcchhcp.supabase.co/storage/v1/object/public/pictures/public/tsenguun.jpeg", linkedin: "https://www.linkedin.com/in/tsenguun-ts/" },
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
  const name = `${member.User?.firstName || ""} ${member.User?.lastName || ""}`.trim();
  const profilePic = member.User?.profilePic || "/avatar.png";
  
  return (
    <a
      href={member.User?.linkedin || "#"}
      target="_blank"
      rel="noopener noreferrer"
      data-aos="fade-up"
      className="flex flex-col items-center hover:-translate-y-2 transition-transform duration-300 w-44"
    >
      <div className="w-[140px] h-[180px] rounded-2xl overflow-hidden border-4 border-[#FFCA3A] mb-3 bg-[#E2E8F0]">
        <Image
          src={profilePic.startsWith("http") ? profilePic : "/avatar.png"}
          alt={name}
          width={140}
          height={180}
          className="object-cover w-full h-full"
          unoptimized
        />
      </div>
      <h3 className="text-white font-bold text-center text-lg leading-tight mb-1">{name}</h3>
      <p className="text-[#FFCA3A] text-sm text-center mb-1">{member.name}</p>
      <p className="text-white/70 text-xs text-center">{member.User?.schoolName}</p>
    </a>
  );
};

const TeamSection = () => {
  const [historicalMembers, setHistoricalMembers] = useState<Record<string, TeamMemberInfo[]> | null>(null);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);

  useEffect(() => {
    AOS.init({ duration: 800, once: true });

    // Fetch historical members
    const fetchHistoricalMembers = async () => {
      try {
        const response = await fetch('/api/user/members');
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
    <section className="w-full bg-[#001049] py-12 px-6 pb-24 font-poppins">
      <h2
        className="font-['Syne-Bold'] text-white text-center mb-12 leading-[1.4]"
        data-aos="fade-up"
      >
        <span className="block text-xl sm:text-3xl md:text-4xl">Meet Our Executive Board</span>
        <span className="block text-base sm:text-3xl md:text-4xl" style={{ color: "#FFCA3A" }}>2026 ~ 2027</span>
      </h2>

      {/* Desktop: 4-column grid, 2 rows */}
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
            <Image
              src={member.image}
              alt={member.name}
              width={240}
              height={240}
            />
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
              <Image
                src={member.image}
                alt={member.name}
                width={180}
                height={180}
              />
            </a>
          ))}
        </div>
      </div>

      {/* Strategy Board Section */}
      <h2
        className="font-['Syne-Bold'] text-white text-center mt-24 mb-12 leading-[1.4]"
        data-aos="fade-up"
      >
        <span className="block text-xl sm:text-3xl md:text-4xl">Strategy Board</span>
      </h2>

      {/* Strategy Board Desktop */}
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
            <div className="w-[200px] h-[260px] rounded-2xl overflow-hidden border-4 border-[#FFCA3A] mb-4">
              <Image
                src={member.image}
                alt={member.name}
                width={200}
                height={260}
                className="object-cover w-full h-full"
                unoptimized
              />
            </div>
            <h3 className="text-white font-bold text-xl">{member.name}</h3>
            <p className="text-[#FFCA3A] font-medium">{member.role}</p>
          </a>
        ))}
      </div>

      {/* Strategy Board Mobile */}
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
              <div className="w-[140px] h-[180px] rounded-2xl overflow-hidden border-4 border-[#FFCA3A] mb-3">
                <Image
                  src={member.image}
                  alt={member.name}
                  width={140}
                  height={180}
                  className="object-cover w-full h-full"
                  unoptimized
                />
              </div>
              <h3 className="text-white font-bold text-lg">{member.name}</h3>
              <p className="text-[#FFCA3A] text-sm">{member.role}</p>
            </a>
          ))}
        </div>
      </div>

      {/* Historical Executive Team Members Default Dropdown */}
      {historicalYears.length > 0 && (
        <div className="mt-24 max-w-7xl mx-auto px-6">
          <h2
            className="font-['Syne-Bold'] text-white text-center mb-8 leading-[1.4]"
            data-aos="fade-up"
          >
            <span className="block text-xl sm:text-3xl md:text-3xl">Historical Executive Teams</span>
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
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 1rem center',
                backgroundSize: '1.5em 1.5em',
                paddingRight: '3rem'
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

          {/* Display selected year's members */}
          {selectedYear && historicalMembers && historicalMembers[selectedYear] && (
            <div className="mb-12">
              <h3 className="text-[#FFCA3A] text-xl md:text-2xl font-bold mb-8 text-center" data-aos="fade-up">
                Executive Team {selectedYear} ~ {parseInt(selectedYear) + 1}
              </h3>
              <div className="flex flex-wrap justify-center gap-x-8 gap-y-10">
                {historicalMembers[selectedYear].map((member, index) => (
                  <HistoricalMemberCard key={`historical-${selectedYear}-${index}`} member={member} />
                ))}
              </div>
            </div>
          )}

          {/* Show message when no year is selected */}
          {!selectedYear && (
            <div className="text-center pb-8 text-white/60" data-aos="fade-up">
              <p>Select a year from the dropdown above to view past Executive Team members.</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default TeamSection;
