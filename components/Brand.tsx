import Link from "next/link";

type Props = {
  href?: string | null;
  compact?: boolean;
  className?: string;
  label?: string;
};

export function SecuvoraMark({ className = "" }: { className?: string }) {
  return (
    <svg className={"secuvora-mark " + className} viewBox="0 0 512 512" role="img" aria-label="Secuvora">
      <g className="secuvora-mark-shell">
        <path d="M55 265 L51 274 L51 359 L55 368 L65 378 L248 484 L257 485 L264 483 L319 451 L325 446 L326 444 L326 423 L322 418 L158 327 L149 319 L147 313 L147 219 L142 215 L136 216 L66 256 Z"/>
        <path d="M341 74 L337 70 L260 27 L246 28 L66 130 L54 139 L51 146 L51 238 L59 236 L236 134 L251 128 L259 128 L266 130 L334 169 L339 168 L343 162 L343 79 Z"/>
        <path d="M371 215 L365 216 L362 220 L362 313 L360 319 L351 327 L284 364 L281 368 L282 371 L340 404 L347 414 L348 434 L449 375 L455 369 L460 357 L460 276 L456 266 L447 258 Z"/>
        <path d="M364 86 L364 178 L367 185 L376 193 L446 233 L460 239 L460 152 L456 142 L444 132 Z"/>
      </g>
      <g className="secuvora-mark-core">
        <path d="M187 209 L187 212 L190 215 L252 250 L260 249 L322 213 L321 207 L257 171 L252 171 L193 204 Z"/>
        <path d="M328 226 L268 260 L262 267 L262 337 L263 338 L266 338 L324 305 L329 299 L329 227 Z"/>
        <path d="M180 227 L180 298 L182 302 L243 338 L246 338 L247 337 L247 267 L241 260 L187 229 Z"/>
      </g>
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
