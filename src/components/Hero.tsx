"use client";

import React from "react";

function Hero() {

  return (
    <section className="relative overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 z-0"
        style={{ backgroundImage: "url('/assets/herobg.svg')", backgroundSize: "cover", backgroundPosition: "center" }}
      />

      {/* Content */}
      <div className="relative z-10 pl-16 pr-0 py-24 flex flex-col lg:flex-row justify-between items-center gap-10">
        {/* Left */}
        <div className="w-full lg:flex-1 lg:max-w-[980px]">
          <h1 className="font-['Syne-Bold'] text-[58px] leading-[1.35] text-white mb-6">
            We connect{" "}
            <span className="relative inline-block">
              Mongolian
              <span className="absolute -bottom-3 left-0 w-full h-[23px] bg-no-repeat bg-contain z-[-1]" style={{ backgroundImage: "url('/assets/redline.svg')" }} />
            </span>
            <br />students pursuing higher<br />education in the{" "}
            <span className="relative inline-block">
              US.
              <span className="absolute -bottom-3 left-0 w-full h-[20px] bg-no-repeat bg-contain" style={{ backgroundImage: "url('/assets/yellowline.svg')" }} />
            </span>
          </h1>

          <p className="text-white/75 text-lg mb-10 max-w-4xl">
            AMSA empowers, supports, and unites the Mongolian student community across America
          </p>

          <div className="flex gap-4 items-center flex-wrap">
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
        <div className="w-full lg:flex-1 flex justify-center lg:justify-end items-center">
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
