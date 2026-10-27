import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./enhancements.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ShipSafe — Know the risks before you ship",
  description:
    "ShipSafe helps developers understand application security risks, why they matter, and how to fix them. Free initial assessment, $19 one-time detailed report.",
  openGraph: {
    title: "ShipSafe — Know the risks before you ship",
    description: "Clear, actionable application security. Free overview. $19 detailed report, one time.",
    type: "website",
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <meta name="theme-color" content="#fcfdff" />
      </head>
      <body>{children}</body>
    </html>
  );
}
