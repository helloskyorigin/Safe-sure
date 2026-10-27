import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Contact | ShipSafe",
  description: "How to contact the ShipSafe project while its commercial service is in preparation.",
};

export default function ContactPage() {
  return (
    <LegalPage eyebrow="CONTACT / FEEDBACK" title="Get in touch." lead="ShipSafe is in development. Here is the appropriate way to share early feedback.">
      <h2>General product feedback</h2>
      <p>For non-sensitive product feedback or website bugs, you can open a public issue in the project's repository.</p>
      <p><a className="legal-external" href="https://github.com/helloskyorigin/Safe-sure/issues" target="_blank" rel="noopener noreferrer">Open GitHub issues <ArrowUpRight size={15}/></a></p>
      <h2>Keep private details private</h2>
      <p>GitHub issues are public. Never post credentials, confidential source code, payment details, exploit instructions, sensitive reports or personal identification information there.</p>
      <h2>Private support is being set up</h2>
      <p>A dedicated private support, privacy and security disclosure contact will be listed here before ShipSafe begins accepting application access or payments. Until then, the website is a preview and cannot accept sensitive disclosures.</p>
      <h2>Useful links</h2>
      <p>Read our <Link href="/privacy">privacy policy</Link>, <Link href="/terms">terms</Link> and <Link href="/security">security practices</Link>.</p>
    </LegalPage>
  );
}
