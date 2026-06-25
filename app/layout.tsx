import type { Metadata } from "next";
import { Geist_Mono, Caveat, Inter_Tight } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import { Navbar, Footer } from "@/components/layout";
import { AIConcierge } from "@/components/ui";

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "ShiftsDeal - Find & Book Perfect Venues",
  description: "India's leading venue discovery and booking platform. Find training halls, auditoriums, conference rooms, and more for your next event.",
  keywords: ["venue booking", "event space", "training hall", "conference room", "auditorium", "India"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${interTight.variable} ${geistMono.variable} ${caveat.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          <Navbar />
          <main className="min-h-screen pt-16">
            {children}
          </main>
          <Footer />
          <AIConcierge />
        </Providers>
      </body>
    </html>
  );
}
