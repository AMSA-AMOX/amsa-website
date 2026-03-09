import Hero from "@/components/Hero";
import UniversityLogos from "@/components/UniversityLogos";
import MissionStatement from "@/components/MissionStatement";
import ProgramsSection from "@/components/ProgramsSection";
import InfoCTASection from "@/components/InfoCTASection";

export default function HomePage() {
  return (
    <>
      <Hero />
      <div className="relative z-0 hidden sm:block">
        <UniversityLogos />
      </div>
      <div className="pt-[300px] sm:pt-[80px] md:pt-[160px] lg:pt-[220px]">
        <MissionStatement />
        <ProgramsSection />
      </div>
      <InfoCTASection />
    </>
  );
}
