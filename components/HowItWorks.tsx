export default function HowItWorks() {
  return (
    <section id="how" className="section">
      <div className="container">
        <div className="section-heading ">
          <p className="eyebrow">THE PROCESS</p>
          <h2>How your security agent works</h2>
          <p>An automated security investigation, on demand. No launch deadline required.</p>
        </div>
        <div className="steps">
          <article className="step ">
            <div className="step-head">
              <div className="step-icon">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="m10 13 4-4m-7 9-1 1a4 4 0 0 1-5.6-5.6l5-5a4 4 0 0 1 5.6 0m2 0 1-1a4 4 0 0 1 5.6 5.6l-5 5a4 4 0 0 1-5.6 0"
                    transform="translate(2 -1)"
                  />
                </svg>
              </div>
              <span>01</span>
            </div>
            <h3>Connect a repository</h3>
            <p>
              Select a public GitHub repository—or an authorized private repository when connected. The agent operates read-only.
            </p>
          </article>
          <article className="step ">
            <div className="step-head">
              <div className="step-icon">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="5" y="3" width="14" height="18" rx="2" />
                  <path d="M9 8h6M9 12h6M9 16h4" />
                </svg>
              </div>
              <span>02</span>
            </div>
            <h3>Agent investigates</h3>
            <p>
              Secuvora follows a real workflow: inspect source, check credentials and configurations, query OSV advisories, then organize the evidence.
            </p>
          </article>
          <article className="step ">
            <div className="step-head">
              <div className="step-icon">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="5" y="10" width="14" height="11" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" />
                </svg>
              </div>
              <span>03</span>
            </div>
            <h3>Review evidence & fix</h3>
            <p>
              Access affected files, supporting evidence, impact and actionable
              fix guidance in the same full report.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
