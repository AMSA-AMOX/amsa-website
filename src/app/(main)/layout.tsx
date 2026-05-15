import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EventAnnouncementBar from "@/components/EventAnnouncementBar";
import EventFloatingAd from "@/components/EventFloatingAd";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <EventAnnouncementBar />
      <Navbar />
      {children}
      <Footer />
      <EventFloatingAd />
    </>
  );
}
