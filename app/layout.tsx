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
  title: "Secuvora — Your on-demand security agent",
  description:
    "Secuvora is an on-demand automated security agent for GitHub repositories. It investigates supported source patterns, potential credentials, configuration risks and OSV dependency advisories, with evidence-based, free reports. AI model reasoning is not enabled.",
  openGraph: {
    title: "Secuvora — Your on-demand security agent",
    description: "An evidence-backed security agent for developers. Read-only source analysis, published vulnerability intelligence and actionable findings, free.",
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
        <Script id="secuvora-disable-scroll-restore" strategy="beforeInteractive">{"try { history.scrollRestoration = 'manual'; } catch (e) {}"}</Script>
        <meta name="theme-color" content="#fcfdff" />
      </head>
      <body>{children}</body>
    </html>
  );
}
