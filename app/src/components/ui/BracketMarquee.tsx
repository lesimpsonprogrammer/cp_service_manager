const SEQUENCE = "<([{  <([{  <(())}]>  )}]>  <([{  <([{  <(())}]>  )}]>  ";

export function BracketMarquee({ className = "" }: { className?: string }) {
  return (
    <div className={`overflow-hidden whitespace-nowrap font-mono text-sm text-muted/40 ${className}`} aria-hidden="true">
      <div className="bracket-marquee-track">
        <span>{SEQUENCE.repeat(4)}</span>
        <span>{SEQUENCE.repeat(4)}</span>
      </div>
    </div>
  );
}
