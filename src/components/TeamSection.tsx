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
  { name: "Arvin", image: "/team/arvin.svg", linkedin: "https://www.linkedin.com/in/arvin-ariunbat-558a3b391/" },
  { name: "Bilgee", image: "/team/bilgee.svg", linkedin: "https://www.linkedin.com/in/bilgeeb/" },
  { name: "Ozi", image: "/team/ozi.svg", linkedin: "https://www.linkedin.com/in/ozi-erdenebat-12b0ab2b0/" },
];

const TeamSection = () => {
  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);

  return (
    <section className="w-full bg-[#001049] py-16 px-6 font-poppins">
      <h2
        className="text-4xl font-['Syne-Bold'] text-white text-center mb-12"
        data-aos="fade-up"
      >
        Meet Our Team <span style={{ color: "#FFCA3A" }}>2026 ~ 2027</span>
      </h2>

      {/* Desktop: 4-column grid, 2 rows */}
      <div className="hidden md:grid grid-cols-4 gap-8 max-w-6xl mx-auto">
        {teamMembers.map((member, index) => (
          <a
            key={member.name}
            href={member.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            data-aos="fade-up"
            data-aos-delay={index * 80}
            className="flex items-center justify-center hover:-translate-y-2 transition-transform duration-300"
          >
            <Image
              src={member.image}
              alt={member.name}
              width={192}
              height={192}
            />
          </a>
        ))}
      </div>

      {/* Mobile: horizontal scroll */}
      <div className="md:hidden overflow-x-auto scrollbar-hide">
        <div className="flex gap-6 w-max px-2 pb-4">
          {teamMembers.map((member, index) => (
            <a
              key={member.name}
              href={member.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              data-aos="fade-left"
              data-aos-delay={index * 60}
              className="flex-shrink-0"
            >
              <Image
                src={member.image}
                alt={member.name}
                width={144}
                height={144}
              />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TeamSection;
