"use client";

import React, { useEffect } from "react";
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

const TeamSection = () => {
  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);

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
    </section>
  );
};

export default TeamSection;
