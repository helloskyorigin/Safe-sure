# ShipSafe (Next.js)

ShipSafe is a developer-first application security assessment product, rewritten as a modern **Next.js App Router** application.

## Overview

ShipSafe helps developers understand application security risks, why they matter, and how to fix them with clear, actionable application security assessments.

### Features & Architecture

- **Next.js 15 App Router**: Built with modular React server and client components in `app/` and `components/`.
- **Navigation & Sticky Header**: Responsive navigation header with scroll detection, mobile slide-out drawer, accessible keyboard navigation, and skip links.
- **Hero & Interactive 3D Report Card**: Realistic 3D perspective security assessment preview showcasing severity indicators (Critical, High, Medium, Low), potential findings, and evidence tags.
- **Process & Security by Design**: Three-step workflow visualization and trust architecture items highlighting read-only source access, evidence-backed findings, and explicit scope limits.
- **Pricing & FAQ**: One-time $19 detailed report pricing card and native interactive FAQ accordion.
- **Pre-Launch Assessment Dialog**: Accessible dialog informing users about read-only security scans and product launch status with clean backdrop blur and keyboard dismissal.

### Development

Run the development server on port 3000:

```sh
npm run dev
```

Build for production:

```sh
npm run build
npm start
```

### Design Principles

- White professional visual system with typography powered by Inter font.
- Fully responsive across desktop, tablet, and mobile breakpoints.
- Accessible interactions with reduced-motion support and ARIA attributes.
