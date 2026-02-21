"use client";

import React from "react";

const imageNames = [
  "Floating1.png", "Floating2.png", "Floating3.png",
  "Floating4.png", "Floating5.png", "Floating6.png",
  "Floating7.png", "Floating8.png", "Floating9.png",
];

const FloatingGallery = () => {
  return (
    <>
      <style>{`
        .floating-gallery {
          position: relative;
          height: 400px;
          overflow: hidden;
          background-color: #fff;
          margin: 10px 0px;
        }
        .balloon-container {
          position: relative;
          width: 100%;
          height: 100%;
        }
        .balloon {
          position: absolute;
          width: 200px;
          height: 200px;
          border-radius: 50%;
          object-fit: cover;
          animation: balloonFloat 15s ease-in-out infinite;
          opacity: 0.95;
          transition: transform 0.3s ease;
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.65);
        }
        .balloon:hover {
          transform: scale(1.1);
          z-index: 2;
        }
        .balloon1 { top: 10%; left: 5%; animation-delay: 0s; }
        .balloon2 { top: 40%; left: 15%; animation-delay: 1s; }
        .balloon3 { top: 20%; left: 30%; animation-delay: 2s; }
        .balloon4 { top: 5%; left: 45%; animation-delay: 3s; }
        .balloon5 { top: 35%; left: 55%; animation-delay: 4s; }
        .balloon6 { top: 10%; left: 70%; animation-delay: 5s; }
        .balloon7 { top: 30%; left: 80%; animation-delay: 6s; }
        .balloon8 { top: 15%; left: 90%; animation-delay: 2s; }
        .balloon9 { top: 45%; left: 25%; animation-delay: 4s; }
        @keyframes balloonFloat {
          0% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
          100% { transform: translateY(0); }
        }
      `}</style>
      <section className="floating-gallery">
        <div className="balloon-container">
          {imageNames.map((img, index) => (
            <img
              key={index}
              src={`/assets/FloatingGallery/${img}`}
              alt={`Event ${index + 1}`}
              className={`balloon balloon${index + 1}`}
            />
          ))}
        </div>
      </section>
    </>
  );
};

export default FloatingGallery;
