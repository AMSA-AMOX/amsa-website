"use client";

import React, { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

export default function MissionStatement() {
  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);

  return (
    <section className="w-full bg-white py-20 px-6 text-center font-poppins overflow-hidden">
      <p
        className="text-md font-semibold tracking-[0.2em] uppercase text-gray-400 mb-8"
        data-aos="fade-up"
      >
        What We Do
      </p>

      <div className="relative flex items-center justify-center">
        {/* Left scattered images — desktop only */}
        <div className="hidden xl:block absolute left-0 w-[340px] h-[460px] pointer-events-none">
          <img
            src="/assets/FloatingGallery/Floating1.png"
            alt=""
            data-aos="fade-right"
            data-aos-delay="0"
            className="absolute rounded-full object-cover shadow-xl -rotate-6"
            style={{ width: 170, height: 170, top: 0, left: 30 }}
          />
          <img
            src="/assets/FloatingGallery/Floating2.png"
            alt=""
            data-aos="fade-right"
            data-aos-delay="80"
            className="absolute rounded-full object-cover shadow-xl rotate-3"
            style={{ width: 125, height: 125, top: 155, left: 160 }}
          />
          <img
            src="/assets/FloatingGallery/Floating3.png"
            alt=""
            data-aos="fade-right"
            data-aos-delay="160"
            className="absolute rounded-full object-cover shadow-xl -rotate-2"
            style={{ width: 155, height: 155, top: 295, left: 20 }}
          />
        </div>

        {/* Center text */}
        <div className="w-full max-w-4xl xl:mx-[360px]" data-aos="fade-up" data-aos-delay="80">
          <h2 className="font-['Syne-Bold'] text-[#001049] text-3xl sm:text-4xl md:text-5xl leading-[1.25] mb-10">
            AMSA&apos;s mission is to{" "}
            <span className="inline-flex items-center gap-1">
              empower
              <svg xmlns="http://www.w3.org/2000/svg" className="inline-block w-8 h-8 md:w-10 md:h-10 text-[#001049] align-middle" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
              </svg>
            </span>{" "}
            Mongolian students{" "}
            <span className="inline-flex items-center gap-1">
              pursuing
              <svg xmlns="http://www.w3.org/2000/svg" className="inline-block w-8 h-8 md:w-10 md:h-10 text-[#001049] align-middle" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
            </span>{" "}
            higher education in the U.S. and build a{" "}
            <span className="inline-flex items-center gap-1">
              thriving community
              <svg xmlns="http://www.w3.org/2000/svg" className="inline-block w-8 h-8 md:w-10 md:h-10 text-[#001049] align-middle" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </span>{" "}
            of future leaders.
          </h2>
          <div className="flex justify-center">
            <a
              href="/team"
              className="hero-cta"
              style={{ background: "#001049", color: "white" }}
            >
              Meet the Team
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
        </div>

        {/* Right scattered images — desktop only */}
        <div className="hidden xl:block absolute right-0 w-[340px] h-[460px] pointer-events-none">
          <img
            src="/assets/FloatingGallery/Floating7.png"
            alt=""
            data-aos="fade-left"
            data-aos-delay="0"
            className="absolute rounded-full object-cover shadow-xl rotate-5"
            style={{ width: 140, height: 140, top: 10, right: 60 }}
          />
          <img
            src="/assets/FloatingGallery/Floating5.png"
            alt=""
            data-aos="fade-left"
            data-aos-delay="80"
            className="absolute rounded-full object-cover shadow-xl -rotate-4"
            style={{ width: 175, height: 175, top: 145, right: 160 }}
          />
          <img
            src="/assets/FloatingGallery/Floating6.png"
            alt=""
            data-aos="fade-left"
            data-aos-delay="160"
            className="absolute rounded-full object-cover shadow-xl rotate-2"
            style={{ width: 130, height: 130, top: 320, right: 30 }}
          />
        </div>
      </div>
    </section>
  );
}
