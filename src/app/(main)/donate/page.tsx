import React from "react";
import Image from "next/image";

export const metadata = {
  title: "Donate | AMSA",
  description: "Support the Best University Opportunity Program (BUOP) to help Mongolian students study in the United States.",
};

const DonatePage = () => {
  return (
    <section className="min-h-screen bg-[#F0F4F8] pt-32 pb-24 px-6 md:px-12 font-poppins text-[#001049]">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-12 items-center md:items-start">
        {/* Left Side: Text and Logo */}
        <div className="flex-1 flex flex-col bg-white p-8 md:p-10 rounded-3xl shadow-lg border-2 border-[#E2E8F0]">
          <div className="flex items-center gap-4 mb-6">
            <Image
              src="/header-logo.svg"
              alt="AMSA Logo"
              width={64}
              height={64}
              className="object-contain"
            />
            <h1 className="text-3xl md:text-4xl font-['Syne-Bold']">Donation</h1>
          </div>

          <div className="space-y-6 text-base md:text-lg leading-relaxed text-gray-700">
            <p>
              Every summer the Association of Mongolian Students in America
              organizes the "Best University Opportunity Program" which provides
              middle and high school students as well as young professionals
              with the tools and knowledge that they need to pursue higher
              education in the US.
            </p>
            <p>
              One of our goals is to advance educational equity in Mongolia by
              providing up to 100 promising students from low income families
              with an opportunity to receive scholarships and take classes of
              their choices at BUOP. BUOP scholarship recipients are selected
              based on their applicant’s academic excellence, extracurricular
              activities, determination, and financial background. Each student
              is given personal attention and made sure that they are
              surrounded by brilliant ambitious students and teachers.
            </p>
            <p className="font-semibold text-[#001049]">
              To this end, we ask that you take part in our cause and help
              students achieve their goals of furthering their education in the
              US. Thank you for your generosity.
            </p>
          </div>
        </div>

        {/* Right Side: Donorbox Embed */}
        <div className="w-full md:w-[500px] flex-shrink-0">
          <div className="bg-white rounded-3xl shadow-lg p-4 border-2 border-[#E2E8F0]">
            <iframe
              src="https://donorbox.org/embed/amsa-fundraiser?amount=20"
              height="500px"
              width="100%"
              style={{
                maxWidth: "500px",
                minWidth: "310px",
                maxHeight: "none !important",
              }}
              seamless={true}
              name="donorbox"
              frameBorder="0"
              scrolling="no"
              className="rounded-2xl"
            ></iframe>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DonatePage;
