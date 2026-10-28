import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./enhancements.css";
import Script from "next/script";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ShipSafe — Know the risks before you ship",
  description:
    "ShipSafe helps developers understand application security risks, why they matter, and how to fix them. Full report details included. Real read-only public GitHub scanning; private integration in development.",
  openGraph: {
    title: "ShipSafe — Know the risks before you ship",
    description: "Clear, actionable application security. Full security report with evidence and fixes, no report paywall.",
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
        <Script id="shipsafe-disable-scroll-restore" strategy="beforeInteractive">{"try { history.scrollRestoration = 'manual'; } catch (e) {}"}</Script>
        <meta name="theme-color" content="#fcfdff" />
      </head>
      <body>{children}</body>
    </html>
  );
}
