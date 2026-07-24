import type { Metadata } from "next";
import { Hind, Inter, Mukta, Noto_Sans_Devanagari, Noto_Serif_Devanagari } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Volt Admin Web Portal",
  description: "Volt Rewards admin operations",
};

const hind = Hind({
  subsets: ["devanagari", "latin"],
  weight: ["400", "600", "700"],
  variable: "--font-hind",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const mukta = Mukta({
  subsets: ["devanagari", "latin"],
  weight: ["400", "600", "700"],
  variable: "--font-mukta",
  display: "swap",
});

const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari", "latin"],
  weight: ["400", "600", "700"],
  variable: "--font-noto-sans-devanagari",
  display: "swap",
});

const notoSerifDevanagari = Noto_Serif_Devanagari({
  subsets: ["devanagari", "latin"],
  weight: ["400", "600", "700"],
  variable: "--font-noto-serif-devanagari",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const fontVariables = [
    hind.variable,
    inter.variable,
    mukta.variable,
    notoSansDevanagari.variable,
    notoSerifDevanagari.variable,
  ].join(" ");

  return (
    <html className={fontVariables} lang="en">
      <body>{children}</body>
    </html>
  );
}
