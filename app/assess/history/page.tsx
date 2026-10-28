import type { Metadata } from "next";
import SavedReports from "@/components/SavedReports";
export const metadata: Metadata = { title: "Saved security reports | ShipSafe",
  robots: { index: false, follow: false } };
export default function HistoryPage() { return <SavedReports/>; }
