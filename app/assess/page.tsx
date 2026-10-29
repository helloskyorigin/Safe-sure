import type { Metadata } from "next";
import AssessmentStart from "@/components/AssessmentStart";
import "./assess.css";

export const metadata: Metadata = {
  title: "Start an investigation | Secuvora",
  description: "Choose a public GitHub source or authorize private access when configured. Begin a read-only, evidence-based security review.",
  robots: { index: false, follow: true },
};

export default function AssessPage() {
  return <AssessmentStart />;
}
