import type { Metadata } from "next";
import "./globals.css";
import "./enhancements.css";
import "./investigation-design.css";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Secuvora — Security Investigations",
  description:
    "Investigate potential security exposure with source-level evidence, dependency advisories, scope and remediation guidance. Public-source reviews available now; autonomous model reasoning is not yet enabled.",
  openGraph: {
    title: "Secuvora — Security Investigations",
    description: "Security investigations grounded in source evidence and actionable next steps. Read-only public reviews available now.",
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
    <html lang="en">
      <head>
        <Script id="secuvora-disable-scroll-restore" strategy="beforeInteractive">{"try { history.scrollRestoration = 'manual'; } catch (e) {}"}</Script>
        <meta name="theme-color" content="#fcfdff" />
      </head>
      <body>{children}</body>
    </html>
  );
}
