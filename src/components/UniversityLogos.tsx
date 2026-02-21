"use client";

import React from "react";

const logos = [
  "brown.png",
  "columbia.png",
  "harvard-logo-black-transparent.png",
  "JonhsHopkins.png",
  "mit.png",
  "mountholyoke.png",
  "NYU.png",
  "stanford-logo-black-transparent.png",
  "vanderbilt.png",
  "wesleyan.png",
];

function UniversityLogos() {
  return (
    <>
      <style>{`
        .logo-section {
          overflow: hidden;
          white-space: nowrap;
          background: transparent;
          padding: 20px 0;
        }
        .logo-track {
          display: inline-block;
          white-space: nowrap;
          animation: logoScroll 60s linear infinite;
        }
        .logo-img {
          display: inline-block;
          height: 60px;
          margin: 0 40px;
          opacity: 0.8;
          transition: transform 0.3s ease;
        }
        .logo-img:hover {
          opacity: 1;
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
