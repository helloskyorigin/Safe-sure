export default function SecuritySection() {
  return (
    <section id="security" className="section bordered">
      <div className="container">
        <div className="split-heading ">
          <div>
            <p className="eyebrow">WHAT WE CHECK</p>
            <h2>
              Focused checks.
              <br />
              Clear evidence.
            </h2>
          </div>
          <p>
            Secuvora inspects authorized GitHub source for supported credential, dependency and configuration signals. Every result shows its evidence and scope—not a promise that the entire app is secure.
          </p>
        </div>
        <div className="trust-grid">
          <article className="trust-item ">
            <div className="trust-icon">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 2 3 6v6c0 5 3.4 8 9 10 5.6-2 9-5 9-10V6l-9-4Z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <h3>Potential exposed credentials</h3>
            <p>
              Find supported hard-coded secret patterns and review masked evidence before deciding whether rotation is needed.
            </p>
          </article>
          <article className="trust-item ">
            <div className="trust-icon">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8l-5-5H8Z" />
                <path d="M15 3v6h6M7 13h10M7 17h7" />
              </svg>
            </div>
            <h3>Known vulnerable dependencies</h3>
            <p>
              Match supported locked package versions against published OSV vulnerability advisories, with version and source context.
            </p>
          </article>
          <article className="trust-item ">
            <div className="trust-icon">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="5" y="10" width="14" height="11" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" />
              </svg>
            </div>
            <h3>Risky configuration signals</h3>
            <p>
              Identify supported unsafe source settings, including security-bypass patterns. Static checks do not replace runtime or database-access testing.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
