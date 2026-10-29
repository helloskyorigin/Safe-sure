import Link from "next/link";

type Props = {
  href?: string | null;
  compact?: boolean;
  className?: string;
  label?: string;
};

export function SecuvoraMark({ className = "" }: { className?: string }) {
  return (
    <svg className={"secuvora-mark " + className} viewBox="0 0 100 100" role="img" aria-label="Secuvora">
      <path className="secuvora-mark-shell" d="M18 31.5 47.7 14.2c1.6-.9 3.5-.9 5.1 0l21.4 12.4c1.7 1 2.8 2.8 2.8 4.8v14.8c0 2.4-2.6 3.9-4.7 2.7L52.7 37.6a5.2 5.2 0 0 0-5.2 0L21.8 52.4c-2.1 1.2-4.8-.3-4.8-2.7V36.3c0-2 1-3.8 2.8-4.8Z"/>
      <path className="secuvora-mark-shell" d="m80.7 31.5 11.5 6.7c1.7 1 2.8 2.8 2.8 4.8v24.9c0 2.4-2.6 3.9-4.7 2.7l-10.1-5.8a5.4 5.4 0 0 1-2.7-4.7V34.3c0-2.4 1.1-4 3.2-2.8Z"/>
      <path className="secuvora-mark-shell" d="m20.2 57.5 14-8.1c2.1-1.2 4.7.3 4.7 2.7v18.4c0 1.8 1 3.5 2.5 4.4l25 14.4c2.1 1.2 2.1 4.3 0 5.5l-11.2 6.5a5.2 5.2 0 0 1-5.2 0L19.8 83.8a5.5 5.5 0 0 1-2.8-4.8V62.3c0-2 1-3.8 3.2-4.8Z"/>
      <path className="secuvora-mark-shell" d="m80.4 57.4 10.1 5.8c2.1 1.2 2.1 4.3 0 5.5L71.1 79.9c-2.1 1.2-4.7-.3-4.7-2.7v-8.1c0-1.9 1-3.6 2.6-4.5l6.2-3.6c1.6-.9 3.6-.8 5.2.4Z"/>
      <path className="secuvora-mark-core-top" d="m50 43.6 12.7 7.3c1.8 1 1.8 3.6 0 4.7L50 63l-12.7-7.4c-1.8-1-1.8-3.6 0-4.7L50 43.6Z"/>
      <path className="secuvora-mark-core" d="m36.3 59.5 10.6 6.1v15.5c0 2.1-2.3 3.4-4.1 2.4l-6.5-3.8a5.3 5.3 0 0 1-2.7-4.7V61.1c0-2.1.9-2.7 2.7-1.6Z"/>
      <path className="secuvora-mark-core" d="m63.7 59.5-10.6 6.1v15.5c0 2.1 2.3 3.4 4.1 2.4l6.5-3.8a5.3 5.3 0 0 0 2.7-4.7V61.1c0-2.1-.9-2.7-2.7-1.6Z"/>
    </svg>
  );
}

export default function Brand({ href = "/", compact = false, className = "", label = "Secuvora home" }: Props) {
  const content = (
    <>
      <SecuvoraMark />
      {!compact && <span className="secuvora-wordmark">secuvora</span>}
    </>
  );
  if (href === null) return <span className={"brand secuvora-brand " + className} aria-label={label}>{content}</span>;
  return href.startsWith("#")
    ? <a href={href} className={"brand secuvora-brand " + className} aria-label={label}>{content}</a>
    : <Link href={href} className={"brand secuvora-brand " + className} aria-label={label}>{content}</Link>;
}
