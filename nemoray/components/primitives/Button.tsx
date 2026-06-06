import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "ghost" | "outline" | "solid" | "danger";
type Size = "sm" | "md";

const VARIANT: Record<Variant, string> = {
  ghost: "border border-transparent text-ink-dim hover:text-ink hover:border-hairline",
  outline:
    "border border-hairline-strong text-ink hover:border-nv hover:text-nv hover:shadow-[0_0_14px_-4px_var(--color-nv-glow)]",
  solid:
    "border border-nv bg-nv/15 text-nv hover:bg-nv/25 hover:shadow-[0_0_16px_-4px_var(--color-nv-glow)]",
  danger:
    "border border-critical/50 bg-critical/10 text-critical hover:bg-critical/20 hover:border-critical",
};

const SIZE: Record<Size, string> = {
  sm: "h-7 px-2.5 text-[11px]",
  md: "h-8 px-3 text-xs",
};

export function Button({
  children,
  variant = "outline",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
}) {
  return (
    <button
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-1.5 font-medium uppercase tracking-[0.12em] transition-all",
        "disabled:cursor-not-allowed disabled:opacity-40",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-nv",
        VARIANT[variant],
        SIZE[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
