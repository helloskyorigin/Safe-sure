import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="legal-site min-h-screen flex flex-col justify-between">
      <header className="legal-nav">
        <div className="container legal-nav-inner flex items-center justify-between h-full">
          <Link href="/" className="brand" aria-label="Secuvora home">
            secuvora<span>.</span>
          </Link>
          <Link href="/" className="legal-back flex items-center gap-2">
            <ArrowLeft size={16} /> Back to homepage
          </Link>
        </div>
      </header>
      <main className="container py-24 flex-1 flex flex-col items-center justify-center text-center">
        <p className="eyebrow">404 ERROR</p>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mt-3 mb-4">
          Page not found
        </h1>
        <p className="text-muted-foreground text-sm max-w-md mb-8" style={{ color: "#78869a" }}>
          The page or security finding you were looking for doesn&apos;t exist or has moved.
        </p>
        <Link href="/" className="button button-dark">
          Return home <span aria-hidden="true">→</span>
        </Link>
      </main>
      <footer className="legal-footer border-t border-[#e6ebf2] py-6 text-center text-xs text-[#7c8ca2]">
        <div className="container">
          © {new Date().getFullYear()} Secuvora. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
