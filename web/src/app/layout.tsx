import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "REGA Tracker",
  description: "Flight timeline and live tracking UI for REGA helicopter positions.",
  applicationName: "REGA Tracker",
  appleWebApp: {
    capable: true,
    title: "REGA Tracker",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" className={`${spaceGrotesk.variable} ${ibmPlexMono.variable} h-full`}>
      <body className="min-h-full bg-[var(--sand)] text-slate-950 antialiased">
        {children}
      </body>
    </html>
  );
}