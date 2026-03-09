"use client";

import React from "react";

const logos = [
  "brown.svg",
  "aclogo.png",
  "columbia.png",
  "harvardlogo.png",
  "mit.png",
  "yale.png",
  "berk.svg",
  "umdlogo.svg",
  "princeton.svg",
  "cornell.png",
  "nyu.svg",
  "stanford.svg",
  "gmu.png",
  "wesleyan.png",
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
              src={`/assets/universities/${logo}`}
              alt={`University logo ${index}`}
              className="logo-img"
            />
          ))}
        </div>
      </div>
    </>
  );
}

export default UniversityLogos;
