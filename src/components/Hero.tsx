"use client";

import React from "react";

function Hero() {

  return (
    <section className="relative w-full bg-[#001049]">
      <img src="/assets/herobg3.svg" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover" />
      <div className="relative z-10 px-4 md:pl-10 md:pr-4 lg:pl-16 lg:pr-0 py-16 md:py-20 lg:py-29 flex flex-col lg:flex-row justify-between items-center gap-10">
        {/* Left */}
        <div className="w-full lg:flex-1 lg:max-w-[980px] text-center lg:text-left">
          <h1 className="font-['Syne-Bold'] text-3xl md:text-4xl lg:text-5xl xl:text-[58px] leading-[1.65] text-white mb-4 lg:mb-6">
            We connect{" "}
            <span className="relative inline-block isolate">
              Mongolian
              <span className="hidden lg:block absolute -bottom-0 left-0 w-full h-[23px] bg-no-repeat bg-contain z-[-1]" style={{ backgroundImage: "url('/assets/redline.svg')" }} />
            </span>
            <br />students pursuing higher<br />education in the{" "}
            <span className="relative inline-block">
              US.
              <span className="hidden lg:block absolute -bottom-0 left-0 w-full h-[20px] bg-no-repeat bg-contain" style={{ backgroundImage: "url('/assets/yellowline.svg')" }} />
            </span>
          </h1>

          <p className="text-white/75 text-sm md:text-base lg:text-lg mb-6 lg:mb-10 max-w-4xl">
            AMSA empowers, supports, and unites the Mongolian student community across America
          </p>

          <div className="flex gap-4 items-center flex-wrap justify-center lg:justify-start">
            <a href="/get-involved" className="hero-cta">
              Get Involved
              <span className="icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </span>
            </a>
          </div>
        </div>

        {/* Right */}
        <div className="hidden lg:flex w-full lg:flex-1 justify-center lg:justify-end items-center">
          <img
            src="/assets/heroimg.svg"
            alt="AMSA Students"
            className="w-full max-w-[850px]"
          />
        </div>

      </div>


    </section>
  );
}

export default Hero;
