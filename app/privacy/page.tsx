import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy | ShipSafe",
  description: "How ShipSafe's pre-launch website handles information, and what will change before security assessments launch.",
};

export default function PrivacyPage() {
  return (
    <LegalPage eyebrow="LEGAL / PRIVACY" title="Privacy policy." lead="Your source code is sensitive. Here is what the current ShipSafe preview actually does—and what it does not yet do.">
      <h2>1. Current service status</h2>
      <p>ShipSafe currently presents a marketing website and illustrative security-report examples. The live application connection, scanning, account recovery and paid checkout features are not yet enabled. The “Assess your application” button explains this status and does not request or read your code.</p>
      <h2>2. Information involved in visiting this site</h2>
      <p>You can browse without creating a ShipSafe account or submitting source code. As on most websites, the hosting provider and your browser may process technical request information such as your IP address, browser type, requested pages and timestamps to deliver the site and protect its availability. Any retention of infrastructure logs depends on the configured hosting provider.</p>
      <p>This repository does not currently include a custom marketing analytics tracker, advertising pixel, contact form or account database. We will update this notice if those capabilities are introduced.</p>
      <h2>3. Cookies and third parties</h2>
      <p>ShipSafe's present front end does not intentionally set advertising or analytics cookies. Your hosting environment may use operational cookies or technical logs. The site uses the Next.js font pipeline for its interface typography. Links to external websites are governed by their own notices.</p>
      <h2>4. Application data and payments</h2>
      <p>At this stage, we do not accept repository authorization, process security scan submissions or collect payments through the website. Before those features launch, this policy will describe the exact access permissions, processing providers, code retention/deletion windows, report recovery mechanism and payment processor.</p>
      <h2>5. Information security</h2>
      <p>We intend to request only the permissions needed for an assessment and to minimize retention of application data. These are design intentions rather than claims of a fully deployed scanning system. Never send passwords, API keys or private source code through public feedback channels.</p>
      <h2>6. Your choices and requests</h2>
      <p>You can stop using the pre-launch website at any time. No ShipSafe account deletion is needed because there is no account system at present. For general concerns, consult the <a href="/contact">contact page</a>. A private data-rights contact channel will be added before personal-data collection or purchases are enabled.</p>
      <h2>7. Updates</h2>
      <p>We may revise this policy as ShipSafe develops. Material changes related to launched features will be reflected here before those features become available.</p>
      <p className="legal-note">This notice describes the current pre-launch website. It is not a representation that a scanning backend or payment system has launched.</p>
    </LegalPage>
  );
}
