// TourMateAI wordmark: compass mark + "TourMate" in the display serif with an
// accent-colored "AI". Used in the navbar, auth pages, and footer.

export default function Logo({ size = 'md' }) {
  const iconPx = size === 'lg' ? 34 : 26
  return (
    <span className={`logo logo-${size}`}>
      <svg
        width={iconPx}
        height={iconPx}
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
      >
        {/* Compass ring */}
        <circle cx="16" cy="16" r="14" stroke="var(--color-primary)" strokeWidth="2.5" />
        {/* Needle: clay north, ocean south */}
        <path d="M16 6.5 L19.5 16 L16 14 L12.5 16 Z" fill="var(--color-primary)" />
        <path d="M16 25.5 L12.5 16 L16 18 L19.5 16 Z" fill="var(--color-accent)" />
      </svg>
      <span className="logo-word">
        TourMate<span className="logo-ai">AI</span>
      </span>
    </span>
  )
}
