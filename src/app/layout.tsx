import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const urbanist = localFont({
  src: "./fonts/Urbanist.ttf",
  weight: "400 600",
  style: "normal",
  display: "swap",
  variable: "--font-urbanist",
});
const ysabeauSC = localFont({
  src: "./fonts/YsabeauSC.ttf",
  weight: "400 700",
  style: "normal",
  display: "swap",
  variable: "--font-ysabeau-sc",
});

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
      <body className={`${urbanist.className} ${ysabeauSC.variable}`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
