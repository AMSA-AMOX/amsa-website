"use client";

import React from "react";

// PNGs are served as right-sized WebP from /assets/optimized/universities
// (scripts/optimize-images.mjs); SVGs are used directly.
const logos = [
  "/assets/universities/brown.svg",
  "/assets/optimized/universities/aclogo.webp",
  "/assets/optimized/universities/columbia.webp",
  "/assets/optimized/universities/harvardlogo.webp",
  "/assets/optimized/universities/mit.webp",
  "/assets/optimized/universities/yale.webp",
  "/assets/universities/berk.svg",
  "/assets/universities/umdlogo.svg",
  "/assets/universities/princeton.svg",
  "/assets/optimized/universities/cornell.webp",
  "/assets/universities/nyu.svg",
  "/assets/universities/stanford.svg",
  "/assets/optimized/universities/gmu.webp",
  "/assets/optimized/universities/wesleyan.webp",
];

function UniversityLogos() {
  return (
    <>
      <style>{`
        .logo-section {
          overflow: hidden;
          background: transparent;
          padding: 40px 0;
        }
        .logo-track {
          display: flex;
          width: max-content;
          animation: logoScroll 90s linear infinite;
        }
        .logo-img {
          display: block;
          height: 70px;
          margin: 0 96px;
          filter: grayscale(0) opacity(0.5);
          transition: filter 0.3s ease, opacity 0.3s ease, transform 0.3s ease;
        }
        .logo-img:hover {
          filter: none;
          opacity: 0.9;
          transform: scale(1.1);
        }
        @keyframes logoScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
      <div className="logo-section">
        <div className="logo-track">
          {logos.concat(logos).map((logo, index) => (
            <img
              key={index}
              src={logo}
              alt={`University logo ${index}`}
              className="logo-img"
              loading="lazy"
              decoding="async"
            />
          ))}
        </div>
      </div>
    </>
  );
}

export default UniversityLogos;
