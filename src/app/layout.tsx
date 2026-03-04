import type { Metadata } from "next";
import { Syne, Caveat, Space_Mono } from "next/font/google";
import "./globals.css";

const syne = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const caveat = Caveat({
  variable: "--font-hand",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const spaceMono = Space_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "PAPO — Music. Energy. Movement.",
  description:
    "Official EPK for Papo — DJ, producer, and live performer pushing the boundaries of electronic music.",
  keywords: ["DJ", "electronic music", "producer", "Papo", "EPK"],
  openGraph: {
    title: "PAPO — Music. Energy. Movement.",
    description: "Official EPK for Papo — DJ, producer, and live performer.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${syne.variable} ${caveat.variable} ${spaceMono.variable} bg-background text-foreground antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
