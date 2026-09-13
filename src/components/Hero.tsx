"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";

// Optimized WebP copies (see scripts/optimize-images.mjs); all 1600 px wide.
const heroImages = [
  { src: "/assets/optimized/Hero-alt2.webp", alt: "AMSA Students at Yale" },
  { src: "/assets/optimized/2014agm.webp", alt: "AMSA AGM 2014" },
  { src: "/assets/optimized/2017agm.webp", alt: "AMSA AGM 2017" },
  { src: "/assets/optimized/2025agm.webp", alt: "AMSA AGM 2025" },
];
const HERO_SIZES = "(max-width: 820px) 100vw, (max-width: 1040px) 1040px, 1200px";

function Hero() {
  const [current, setCurrent] = useState(0);
  const hasImages = heroImages.length > 0;
  const safeCurrent = hasImages ? current % heroImages.length : 0;
  const activeImage = hasImages ? heroImages[safeCurrent] : null;

  const goTo = (idx: number) => setCurrent(idx);

  useEffect(() => {
    if (heroImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative w-full bg-[#001049] overflow-visible">
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <Image src="/assets/optimized/herobg.webp" alt="" fill sizes="100vw" className="object-cover" priority />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center px-4 pt-16 md:pt-20 lg:pt-24 pb-0">
        {/* Heading */}
        <h1 className="font-['Syne-Bold'] text-3xl md:text-4xl lg:text-5xl xl:text-[58px] text-white mb-4 lg:mb-6 max-w-7xl leading-[1.3]">
          <span className="block mb-3">
            We connect{" "}
            <span className="relative inline-block">
              Mongolian
              <img src="/assets/redline.svg" aria-hidden="true" className="absolute left-0 w-full z-[-1]" style={{ bottom: "-0.2em", height: "0.4em" }} />
            </span>
            {" "}students
          </span>
          <span className="block">
            pursuing higher education in the{" "}
            <span className="relative inline-block">
              US.
              <img src="/assets/yellowline.svg" aria-hidden="true" className="absolute left-0 w-full z-[-1]" style={{ bottom: "-0.2em", height: "0.35em" }} />
            </span>
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-white/75 text-base md:text-lg mb-6 lg:mb-8 max-w-sm sm:max-w-none sm:whitespace-nowrap text-center">
          AMSA empowers, supports, and unites the Mongolian student community across America
        </p>

        {/* CTA */}
        <div className="flex gap-4 items-center justify-center mb-10 lg:mb-12">
          <a href="/get-involved" className="hero-cta">
            Get Involved
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

        {/* Hero photo carousel — overflows below the background, sits on top of UniversityLogos */}
        <div className="relative z-[20] w-full flex justify-center mb-[-220px] md:mb-[-300px] lg:mb-[-360px]">
          <div
            className="relative w-full max-w-[820px] md:max-w-[1040px] lg:max-w-[1200px] rounded-lg shadow-2xl overflow-hidden"
            style={{ aspectRatio: "16/9" }}
          >
            {activeImage && (
              <Image
                key={activeImage.src}
                src={activeImage.src}
                alt={activeImage.alt}
                fill
                sizes={HERO_SIZES}
                className="object-cover rounded-lg"
                priority={safeCurrent === 0}
              />
            )}
            {/* Slide indicators */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {heroImages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className="transition-all duration-300 rounded-full"
                  style={{
                    width: i === current ? "24px" : "8px",
                    height: "8px",
                    background: i === current ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.4)",
                  }}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
