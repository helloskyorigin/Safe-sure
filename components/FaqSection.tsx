export default function FaqSection() {
  const faqs = [
    {
      question: "Do I need a ShipSafe account?",
      answer:
        "No separate ShipSafe signup is planned. Source access still needs explicit authorization through the connection provider.",
    },
    {
      question: "Will ShipSafe modify my application?",
      answer:
        "No. The initial assessment is designed around read-only permissions. Any recommended fixes are reviewed and applied by you.",
    },
    {
      question: "What exactly is free?",
      answer:
        "The assessment overview shows potential issue counts grouped by severity. The $19 report unlocks the details and suggested fixes for those findings.",
    },
    {
      question: "Does a clean report guarantee safety?",
      answer:
        "No. Automated tools have limited coverage. ShipSafe will describe what has and has not been checked.",
    },
  ];

  return (
    <section id="faq" className="section bordered faq-section">
      <div className="container faq-grid">
        <div className="reveal visible">
          <p className="eyebrow">GOOD TO KNOW</p>
          <h2>
            Straight answers.
            <br />
            No fine print.
          </h2>
        </div>
        <div className="faq-list reveal visible">
          {faqs.map((faq, index) => (
            <details key={index}>
              <summary>
                {faq.question}
                <span aria-hidden="true">+</span>
              </summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
