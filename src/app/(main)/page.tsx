import Hero from "@/components/Hero";
import UniversityLogos from "@/components/UniversityLogos";
import ProgramsSection from "@/components/ProgramsSection";
import FloatingGallery from "@/components/FloatingGallery";
import TeamSection from "@/components/TeamSection";
import InfoCTASection from "@/components/InfoCTASection";
import BlogPreviewSection from "@/components/BlogPreviewSection";

export default function HomePage() {
  return (
    <>
      <Hero />
      <div className="relative z-0">
        <UniversityLogos />
      </div>
      <div className="pt-[80px] md:pt-[160px] lg:pt-[220px]">
        <ProgramsSection />
      </div>
      <FloatingGallery />
      <TeamSection />
      <InfoCTASection />
      <BlogPreviewSection />
    </>
  );
}
