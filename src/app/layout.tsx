import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import LenisProvider from "@/components/ui/LenisProvider";
import CustomCursor from "@/components/cursor/CustomCursor";
import LoadingScreen from "@/components/ui/LoadingScreen";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-space-mono",
});

const playfair = Playfair_Display({
  weight: ["900"],
  subsets: ["latin"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: "Judson J — CS Engineer & ML Developer | The Abyss",
  description: "Portfolio of Judson J — Computer Science student at CIT Chennai, specializing in ML, Full Stack, and Cybersecurity. 300+ LeetCode, IBM & Cisco certified.",
  openGraph: {
    title: "Judson J — CS Engineer & ML Developer | The Abyss",
    description: "Portfolio of Judson J — Computer Science student at CIT Chennai, specializing in ML, Full Stack, and Cybersecurity.",
    type: "website",
    url: "https://judsoncodes.vercel.app", // replace with actual
    images: [{ url: "/og-image.jpg" }] // assume exists
  },
  alternates: {
    canonical: "https://judsoncodes.vercel.app"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Judson J",
    "jobTitle": "CS Engineer & ML Developer",
    "url": "https://judsoncodes.vercel.app",
    "sameAs": [
      "https://github.com/judsoncodes",
      "https://linkedin.com/in/J-JUDSON-CSE"
    ]
  };

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${spaceMono.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col text-white bg-[#020810] cursor-none">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-[99999] bg-[#00e5ff] text-[#020810] px-4 py-2 font-bold rounded">
          Skip to content
        </a>
        <LoadingScreen />
        <CustomCursor />
        <LenisProvider>
          <div id="main-content">
            {children}
          </div>
        </LenisProvider>
      </body>
    </html>
  );
}
