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
        <div className="pricing-intro">
          <p className="eyebrow">FREE BETA INVESTIGATION</p>
          <h2>
            A clearer launch starts
            <br />
            with a code check.
          </h2>
          <p>
            Connect an authorized GitHub repository. Secuvora checks supported risk patterns and matches published dependency advisories, then gives you evidence and next steps in one report.
          </p>
          <div className="no-renew">
            <span>✓</span> Free during beta. No credit card required.
          </div>
        </div>

        <div className="price-card">
          <div className="price-top">
            <div>
              <small>INVESTIGATION OUTPUT</small>
              <h3>Your complete security report.</h3>
            </div>
            <div className="price">
              FREE<span>beta</span>
            </div>
          </div>
          <div className="price-divider"></div>
          <ul className="features">
            <li><span>✓</span> Exact affected files</li>
            <li><span>✓</span> Evidence and risk context</li>
            <li><span>✓</span> Step-by-step remediation</li>
            <li><span>✓</span> Verification guidance</li>
          </ul>
          <a
            href="/assess"
            onClick={handleAssessmentClick}
            data-start
            className="button button-dark price-cta"
          >
            Check my app — free <span aria-hidden="true">→</span>
          </a>
          <p className="price-caption">
            Connected investigations are currently free. Connect GitHub, select an authorized repository, and review the results with read-only access.
          </p>
        </div>
      </div>
    </section>
  );
}
