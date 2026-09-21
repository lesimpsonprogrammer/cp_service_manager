export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/cpsm-logo-navy.png"
        alt="Cloud Performance Service Manager"
        className={`block dark:hidden ${className ?? ""}`}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/cpsm-logo-white.png"
        alt="Cloud Performance Service Manager"
        className={`hidden dark:block ${className ?? ""}`}
      />
    </>
  );
}
