import { cn } from "@/lib/cn";

export type Status = "nominal" | "warning" | "critical" | "info" | "idle";

const COLOR: Record<Status, string> = {
  nominal: "bg-nominal shadow-[0_0_8px_var(--color-nominal)]",
  warning: "bg-warning shadow-[0_0_8px_var(--color-warning)]",
  critical: "bg-critical shadow-[0_0_8px_var(--color-critical)]",
  info: "bg-info shadow-[0_0_8px_var(--color-info)]",
  idle: "bg-ink-faint",
};

export function StatusDot({
  status = "nominal",
  pulse = false,
  className,
}: {
  status?: Status;
  pulse?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block h-2 w-2 rounded-full",
        COLOR[status],
        pulse && status !== "idle" && "animate-pulse-soft",
        className,
      )}
    />
  );
}
