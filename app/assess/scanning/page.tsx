import type { Metadata } from "next";
import ScanningConsole from "@/components/ScanningConsole";
import "./scanning.css";

export const metadata: Metadata = {
  title: "Security inspection | ShipSafe",
  description: "A transparent application security scanning workspace with check-by-check coverage and evidence status.",
  robots: { index: false, follow: false },
};

export default function ScanningPage() {
  return <ScanningConsole />;
}
