# ShipSafe — Legal and trust launch checklist

**Prepared:** 27 October 2026  
**Scope:** Current marketing website and planned $19 one-time security assessment.  
**Important:** The published policy pages accurately describe the site's current pre-launch functionality. They are not a substitute for confirming actual business facts or obtaining legal advice.

## Current website: completed

- [x] Public, responsive Privacy Policy, Terms of Use, Payments & Refunds, Security Practices and Contact pages.
- [x] Central Legal Center and cross-linked footer/navigation.
- [x] Clear disclosures that scan, repository authorization and checkout are **not currently operational**.
- [x] No fabricated certification, registered company, private support address, performance claim or refund transaction.
- [x] Descriptions of routine hosting metadata, third-party links, demo data and limitations.
- [x] Navigation, print styling, section links and plain-language summaries.

## Before inviting paid customers (not yet complete)

1. **Operator identity.** Specify the actual person or registered entity acting as seller/controller, legal or business name as applicable, an authentic business address/contact and applicable legal jurisdiction. Do not describe the business as incorporated if it is not.
2. **Private channels.** Establish and test a working support email or private request portal for privacy, billing and security issues; add a responsible vulnerability disclosure route. Public GitHub issues are *not* a safe private reporting channel.
3. **Hosting and data inventory.** Verify the production provider(s), countries of processing, log settings, subprocessors, analytics and cookie use. Update the privacy policy based on what is actually deployed.
4. **Data governance.** Document retention/deletion periods for uploaded code, temporary scanning workers, logs, reports, and payments. Define access control, recovery flows, breach handling, and who can access raw data.
5. **Security.** Implement selected-repository/explicit user authorization, isolated untrusted-code inspection, protections against SSRF, redaction, rate limits and detailed scan coverage. Test before asserting these controls as live.
6. **Checkout and digital goods.** Decide the merchant of record, supported countries, final tax treatment, currencies, $19 delivery scope, duplicate-charge handling, refund eligibility, appeal process and statutory rights. Publish definitive policies in checkout, not only in the footer.
7. **Contact and grievances.** Depending on actual services, geography and legal category, set up any mandatory grievance contact, response timelines and notices.
8. **Legal review.** Have an appropriately qualified reviewer verify applicability of Indian and other relevant privacy/consumer/e-commerce requirements before collecting source code or money. Applicable Indian law includes the Digital Personal Data Protection framework with phased commencement and consumer protection/e-commerce requirements depending on activities.
9. **Truth-in-marketing checks.** Ensure every claim about encryption, secure storage, uptime, scanner capabilities, processing time, certification, customer logos and testimonials has evidence.
10. **Site quality.** Run \`npm run typecheck\` and \`npm run build\`, then test all six legal routes, small-screen widths, keyboard navigation, print dialog, and the GitHub feedback link.

## Government materials for legal review

- [MeitY: DPDP Rules 2025 and enforcement notifications](https://www.meity.gov.in/documents/act-and-policies/digital-personal-data-protection-rules-2025-gDOxUjMtQWa?pageTitle=Digital-Personal-Data-Protection-Rules-2025%3B)
- [Department of Consumer Affairs: consumer-protection/e-commerce rules](https://consumeraffairs.nic.in/acts-and-rules/consumer-protection/consumer-protection)
- [CERT-In: cybersecurity directions under section 70B](https://www.cert-in.org.in/Directions70B.jsp)

Use the primary texts and take professional advice for applicability, because requirements vary by business structure, service design, user location and commencement date.
