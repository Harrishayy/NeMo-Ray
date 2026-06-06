import { APP } from "@/lib/config";
import { StatusClock } from "./StatusClock";

/**
 * Thin global brand strip. Workspace navigation now lives in the rails (each
 * rail carries its own tab strip), so this bar only holds identity + clock.
 */
export function TopBar() {
  return (
    <header className="relative z-20 flex h-9 shrink-0 items-center gap-3 border-b border-hairline bg-bg-2/90 px-3">
      {/* brand */}
      <div className="flex items-center gap-2.5">
        <span className="flex h-5 w-5 items-center justify-center bg-nv text-[12px] font-bold text-black shadow-[0_0_14px_-2px_var(--color-nv-glow)]">
          ◢
        </span>
        <span className="text-[12px] font-bold uppercase tracking-[0.14em] text-ink">
          {APP.org}
        </span>
        <span className="mx-0.5 h-4 w-px bg-hairline-strong" />
        <span className="eyebrow text-nv text-glow">{APP.title}</span>
        <span className="mx-0.5 hidden h-4 w-px bg-hairline-strong sm:block" />
        <span className="eyebrow hidden text-ink-faint sm:inline">
          {APP.network} for {APP.region}
        </span>
      </div>

      {/* right cluster */}
      <div className="ml-auto flex items-center gap-3">
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
