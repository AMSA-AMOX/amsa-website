import type { Metadata } from "next";
import { Urbanist, Ysabeau_SC } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const urbanist = Urbanist({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-urbanist" });
const ysabeauSC = Ysabeau_SC({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-ysabeau-sc" });

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
