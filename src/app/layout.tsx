import type { Metadata } from "next";
import { Geist, Geist_Mono, Orbitron, JetBrains_Mono, Barlow } from "next/font/google";
import "./globals.css";
import StarfieldProvider from "@/components/starfield/StarfieldProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// gx design-system fonts — consumed via the --font-gx-* vars in globals.css.
const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Myo Myat Thiha — Full-Stack Developer",
  description:
    "Portfolio of Myo Myat Thiha — full-stack developer. Explore award-winning AI, Web3 and platform projects in an interactive 3D galaxy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} ${jetbrains.variable} ${barlow.variable} h-full antialiased`}
    >
      <body className="bg-secondary text-white min-h-full flex flex-col">
        <StarfieldProvider>
          {children}
        </StarfieldProvider>
      </body>
    </html>
  );
}
