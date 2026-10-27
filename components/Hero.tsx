"use client";

interface HeroProps {
  onOpenAssessment: () => void;
}

export default function Hero({ onOpenAssessment }: HeroProps) {
  const handleAssessmentClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onOpenAssessment();
  };

  return (
    <section className="hero">
      <div className="glow glow-left" aria-hidden="true"></div>
      <div className="glow glow-right" aria-hidden="true"></div>
      <div className="container hero-grid">
        <div className="hero-text">
          <p className="eyebrow animate">
            <span className="eyebrow-dash"></span> APPLICATION SECURITY
          </p>
          <h1 className="animate delay-1">
            Know the risks
            <br />
            before you <em>ship.</em>
          </h1>
          <p className="hero-sub animate delay-2">
            Identify security issues in your application, understand their impact,
            and get clear steps to resolve them.
          </p>
          <div className="hero-action animate delay-3">
            <a
              href="#assessment"
              onClick={handleAssessmentClick}
              data-start
              className="button button-dark button-primary"
            >
              Assess your application{" "}
              <span className="button-arrow" aria-hidden="true">
                →
              </span>
            </a>
            <p className="under-cta">
              <span className="tiny-check">✓</span> Free initial assessment{" "}
              <span className="dot-separator">·</span> Detailed fixes for $19
            </p>
          </div>
        </div>

        <div className="preview-wrap animate delay-2">
          <div className="preview-halo" aria-hidden="true"></div>
          <div className="preview">
            <div className="preview-top">
              <strong className="preview-brand">
                shipsafe<span>.</span>
              </strong>
              <span className="example-tag">
                <span className="example-dot"></span> ILLUSTRATIVE REPORT
              </span>
            </div>
            <div className="preview-body">
              <div className="preview-heading">
                <div>
                  <div className="preview-overline">APPLICATION SECURITY</div>
                  <h2>Security assessment</h2>
                  <p>
                    example-app <span>·</span> Illustrative results
                  </p>
                </div>
                <span className="complete-tag">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="m5 12 4 4L19 6" />
                  </svg>{" "}
                  Complete
                </span>
              </div>

              <div className="severity-grid" aria-label="Sample severity counts">
                <div className="severity severity-critical">
                  <div className="severity-name">
                    <i></i>Critical
                  </div>
                  <strong>02</strong>
                </div>
                <div className="severity severity-high">
                  <div className="severity-name">
                    <i></i>High
                  </div>
                  <strong>04</strong>
                </div>
                <div className="severity severity-medium">
                  <div className="severity-name">
                    <i></i>Medium
                  </div>
                  <strong>06</strong>
                </div>
                <div className="severity severity-low">
                  <div className="severity-name">
                    <i></i>Low
                  </div>
                  <strong>01</strong>
                </div>
              </div>

              <div className="findings-head">
                <h3>Potential findings</h3>
                <span>Severity</span>
              </div>

              <div className="findings">
                <div className="finding">
                  <div className="finding-symbol symbol-red">!</div>
                  <div className="finding-copy">
                    <strong>Exposed credential</strong>
                    <small>Potential API key in application code</small>
                  </div>
                  <span className="pill pill-critical">Critical</span>
                </div>
                <div className="finding">
                  <div className="finding-symbol symbol-orange">◇</div>
                  <div className="finding-copy">
                    <strong>Vulnerable dependency</strong>
                    <small>Known package security advisory</small>
                  </div>
                  <span className="pill pill-high">High</span>
                </div>
                <div className="finding">
                  <div className="finding-symbol symbol-yellow">!</div>
                  <div className="finding-copy">
                    <strong>Missing security header</strong>
                    <small>Browser protection configuration</small>
                  </div>
                  <span className="pill pill-medium">Medium</span>
                </div>
              </div>

              <div className="preview-bottom">
                <span>
                  <i></i> Evidence-backed security checks
                </span>
                <span>Preview only</span>
              </div>
            </div>
          </div>
          <div className="floating-label" aria-hidden="true">
            <span>✓</span> Clear findings. Actionable fixes.
          </div>
        </div>
      </div>
    </section>
  );
}
