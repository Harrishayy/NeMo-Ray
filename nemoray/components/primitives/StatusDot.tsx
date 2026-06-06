import { cn } from "@/lib/cn";

export type Status = "nominal" | "warning" | "critical" | "info" | "idle";

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
        "nm-dot",
        `nm-dot--${status}`,
        pulse && status !== "idle" && "nm-pulse",
        className,
      )}
    />
  );
}
