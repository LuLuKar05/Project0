import type { Metadata, Viewport } from "next";
import { Orbitron, JetBrains_Mono, Barlow } from "next/font/google";
import "./globals.css";
import StarfieldProvider from "@/components/starfield/StarfieldProvider";

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

const SITE_TITLE = "Myo Myat Thiha — Full-Stack Developer";
const SITE_DESC =
  "Portfolio of Myo Myat Thiha — full-stack developer. Explore award-winning AI, Web3 and platform projects in an interactive 3D galaxy.";

// Absolute base for resolving OG/Twitter image URLs. On Vercel, VERCEL_URL is
// set automatically; override with NEXT_PUBLIC_SITE_URL for a custom domain.
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESC,
  applicationName: "Myo Myat Thiha — Portfolio",
  authors: [{ name: "Myo Myat Thiha" }],
  creator: "Myo Myat Thiha",
  keywords: [
    "Myo Myat Thiha", "full-stack developer", "portfolio",
    "AI", "Web3", "Next.js", "React", "TypeScript",
  ],
  alternates: { canonical: "/" },
  // Share preview — replace /public/og-image.jpg with a 1200×630 screenshot.
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESC,
    type: "website",
    url: SITE_URL,
    siteName: SITE_TITLE,
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Project galaxy" }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESC,
    images: ["/og-image.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#020610",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${orbitron.variable} ${jetbrains.variable} ${barlow.variable} h-full antialiased`}
    >
      <body className="bg-secondary text-white min-h-full flex flex-col">
        <StarfieldProvider>
          {children}
        </StarfieldProvider>
      </body>
    </html>
  );
}
