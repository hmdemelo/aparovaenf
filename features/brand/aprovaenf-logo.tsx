type AprovaenfLogoProps = {
  className?: string
  markClassName?: string
  textClassName?: string
  compact?: boolean
}

export function AprovaenfLogo({
  className = '',
  markClassName = '',
  textClassName = '',
  compact = false,
}: AprovaenfLogoProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 text-[var(--ink)] ${className}`}
      aria-label="aprovaenf"
    >
      <svg
        viewBox="0 0 84 48"
        aria-hidden="true"
        className={`h-8 w-14 shrink-0 overflow-visible text-[var(--teal)] ${markClassName}`}
      >
        <path
          d="M3 29 H22 L29 17 L38 40 L49 7 L58 32 L68 22 L81 10"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="7"
        />
      </svg>
      {!compact && (
        <span
          className={`aprova-wordmark text-[1.35rem] leading-none text-[var(--ink)] ${textClassName}`}
        >
          aprova<span className="text-[var(--teal)]">enf</span>
        </span>
      )}
    </span>
  )
}
