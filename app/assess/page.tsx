import type { Metadata } from "next";
import AssessmentStart from "@/components/AssessmentStart";
import "./assess.css";

export const metadata: Metadata = {
  title: "Assess your application | ShipSafe",
  description: "Choose a public GitHub URL or connect an authorized private repository. One clear path to a full security report.",
  robots: { index: false, follow: true },
};

export default function AssessPage() {
  return <AssessmentStart />;
}
