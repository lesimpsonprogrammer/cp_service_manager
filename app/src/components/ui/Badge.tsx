import { cn } from "@/lib/utils/cn";

type Tone = "neutral" | "success" | "warning" | "danger" | "brand";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-surface-2 text-muted",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
  brand: "bg-brand/10 text-brand",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}

const STATUS_TONE: Record<string, Tone> = {
  connected: "success",
  succeeded: "success",
  active: "success",
  signed: "success",
  client_approved: "success",
  paid: "success",
  disconnected: "neutral",
  pending: "warning",
  running: "warning",
  sent: "warning",
  internally_approved: "warning",
  queued: "neutral",
  error: "danger",
  failed: "danger",
  client_rejected: "danger",
  overdue: "danger",
  void: "neutral",
  partial: "warning",
};

const DOT_TONE: Record<Tone, string> = {
  neutral: "bg-muted",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  brand: "bg-brand",
};

export function StatusBadge({ status }: { status: string }) {
  const tone = STATUS_TONE[status] ?? "neutral";
  return (
    <Badge tone={tone} className="capitalize">
      <span className={cn("h-1.5 w-1.5 rounded-full", DOT_TONE[tone])} />
      {status}
    </Badge>
  );
}
