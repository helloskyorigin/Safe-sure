"use client";

interface PricingSectionProps {
  onOpenAssessment: () => void;
}

export default function PricingSection({ onOpenAssessment }: PricingSectionProps) {
  const handleAssessmentClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onOpenAssessment();
  };

  return (
    <section id="pricing" className="section bordered pricing-section">
      <div className="container pricing-grid">
        <div className="pricing-intro reveal visible">
          <p className="eyebrow">SIMPLE PRICING</p>
          <h2>
            Clear, affordable
            <br />
            security.
          </h2>
          <p>
            Start with a free summary of security findings by severity. Unlock exact
            details and remediation guidance only when you need them.
          </p>
          <div className="no-renew">
            <span>✓</span> No subscription. No renewal.
          </div>
        </div>

        <div className="price-card reveal visible">
          <div className="price-top">
            <div>
              <small>ONE-TIME DETAILED REPORT</small>
              <h3>Understand every finding</h3>
            </div>
            <div className="price">
              $19<span>one-time</span>
            </div>
          </div>
          <div className="price-divider"></div>
          <ul className="features">
            <li>
              <span>✓</span> Exact affected files
            </li>
            <li>
              <span>✓</span> Why it matters
            </li>
            <li>
              <span>✓</span> Step-by-step guidance
            </li>
            <li>
              <span>✓</span> Potential impact
            </li>
          </ul>
          <a
            href="/assess"
            onClick={handleAssessmentClick}
            data-start
            className="button button-dark price-cta"
          >
            Assess your application <span aria-hidden="true">→</span>
          </a>
          <p className="price-caption">
            Initial severity summary is free. No subscription required.
          </p>
        </div>
      </div>
    </section>
  );
}
