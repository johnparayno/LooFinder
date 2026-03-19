type LooFinderLogoProps = {
  className?: string;
  /** When set, logo is exposed to assistive tech (omit when paired with visible “LooFinder” text). */
  title?: string;
};

/**
 * Brand mark: toilet silhouette + search lens (uses currentColor).
 */
export function LooFinderLogo({ className, title }: LooFinderLogoProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 32"
      width="1.35em"
      height="1.08em"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
    >
      {title ? <title>{title}</title> : null}
      <g
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="4" y="5" width="11" height="12" rx="2" />
        <path d="M7 17h15" />
        <path d="M9 17q5 8.5 10 0" />
        <circle cx="28" cy="11" r="4" />
        <path d="M31 14l5 5" />
      </g>
    </svg>
  );
}
