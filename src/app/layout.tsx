import type { Metadata } from "next";
import { Jost } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const jost = Jost({ subsets: ["latin"], variable: "--font-jost" });

export const metadata: Metadata = {
  title: "AMSA - Association of Mongolian Students in America",
  description:
    "Connecting and empowering Mongolian students across America since 2011.",
  icons: { icon: "/header-logo.svg" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={jost.className}>
        <AuthProvider>
          <Navbar />
          {children}
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
