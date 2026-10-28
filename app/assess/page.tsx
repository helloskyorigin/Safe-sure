import type { Metadata } from "next";
import AssessmentStart from "@/components/AssessmentStart";
import "./assess.css";

export const metadata: Metadata = {
  title: "Assess your application | ShipSafe",
  description: "Connect an application to start a focused security assessment. Explicit permissions, transparent checks and no separate ShipSafe account.",
  robots: { index: false, follow: true },
};

export default function AssessPage() {
  return <AssessmentStart />;
}
