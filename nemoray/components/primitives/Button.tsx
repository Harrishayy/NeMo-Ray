import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "ghost" | "outline" | "solid" | "danger";
type Size = "sm" | "md";

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
      className={cn("nm-btn", `nm-btn--${variant}`, `nm-btn--${size}`, className)}
      {...props}
    >
      {children}
    </button>
  );
}
