import { CloudDrizzle } from "lucide-react";
import { APP } from "@/lib/config";
import { StatusDot } from "@/components/primitives";
import { StatusClock } from "./StatusClock";

/** The global mission-control top bar. */
export function TopBar() {
  return (
    <header className="relative z-20 flex h-12 shrink-0 items-center gap-4 border-b border-hairline bg-bg-2/90 px-3">
      {/* brand */}
      <div className="flex items-center gap-2.5">
        <span className="flex h-6 w-6 items-center justify-center bg-nv text-[13px] font-bold text-black shadow-[0_0_14px_-2px_var(--color-nv-glow)]">
          ◢
        </span>
        <span className="text-[13px] font-bold uppercase tracking-[0.14em] text-ink">
          {APP.org}
        </span>
        <span className="mx-1 h-4 w-px bg-hairline-strong" />
        <span className="eyebrow text-nv text-glow">{APP.title}</span>
      </div>

      {/* operational status */}
      <div className="ml-1 flex items-center gap-2 border border-hairline px-2 py-1">
        <StatusDot status="nominal" pulse />
        <span className="eyebrow text-ink">OPERATIONAL</span>
      </div>

      {/* center title */}
      <div className="mx-auto hidden flex-col items-center md:flex">
        <span className="text-[13px] font-semibold uppercase tracking-[0.22em] text-ink">
          {APP.region} <span className="text-ink-faint">·</span> {APP.network}
        </span>
        <span className="eyebrow text-ink-faint">{APP.subtitle}</span>
      </div>

      {/* right cluster */}
      <div className="ml-auto flex items-center gap-3">
        <div className="hidden items-center gap-1.5 text-ink-dim lg:flex">
          <CloudDrizzle size={14} className="text-info" />
          <span className="readout text-xs">12°C</span>
          <span className="eyebrow text-ink-faint">LIGHT RAIN</span>
        </div>
        <span className="hidden h-4 w-px bg-hairline-strong lg:block" />
        <StatusClock />
        <span className="h-4 w-px bg-hairline-strong" />
        <div className="flex flex-col items-end leading-none">
          <span className="eyebrow text-ink-faint">OPERATOR</span>
          <span className="readout text-xs text-ink">{APP.operator}</span>
        </div>
      </div>
    </header>
  );
}
