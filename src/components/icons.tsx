/* 10–20px stroke icons matching the library's icon set */

function Base({
  children,
  size = 10,
  className = "",
}: {
  children: React.ReactNode;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      style={{ width: `${size / 16}rem`, height: `${size / 16}rem` }}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="square"
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  );
}

export function ArrowLeft({ size, className }: { size?: number; className?: string }) {
  return (
    <Base size={size} className={className}>
      <path d="M20 12H4m0 0l6-6m-6 6l6 6" />
    </Base>
  );
}

export function ArrowRight({ size, className }: { size?: number; className?: string }) {
  return (
    <Base size={size} className={className}>
      <path d="M4 12h16m0 0l-6-6m6 6l-6 6" />
    </Base>
  );
}

export function ArrowUpRight({ size, className }: { size?: number; className?: string }) {
  return (
    <Base size={size} className={className}>
      <path d="M7 17L17 7m0 0H7m10 0v10" />
    </Base>
  );
}

export function ChevronRight({ size, className }: { size?: number; className?: string }) {
  return (
    <Base size={size} className={className}>
      <path d="M9 18l6-6-6-6" />
    </Base>
  );
}

export function SearchMd({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg
      style={{ width: `${size / 16}rem`, height: `${size / 16}rem` }}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      className={className}
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

export function Pause({ className }: { className?: string }) {
  return (
    <svg style={{ width: "0.5rem", height: "0.5rem" }} viewBox="0 0 8 8" fill="currentColor" className={className} aria-hidden>
      <rect x="1.4" y="0" width="1.4" height="8" />
      <rect x="5.1" y="0" width="1.4" height="8" />
    </svg>
  );
}
