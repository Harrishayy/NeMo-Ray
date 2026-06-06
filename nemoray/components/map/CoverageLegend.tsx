import { cn } from "@/lib/cn";
import { signalGradientCss } from "@/lib/geo/color";

/**
 * Downlink-bandwidth ramp legend. Mirrors the exact gradient the map surface
 * uses (`signalGradientCss`) so the two can never drift. Compact, corner-style.
 */
export function CoverageLegend({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none select-none border border-hairline bg-panel/80 px-3 py-2 backdrop-blur-sm",
        className,
      )}
    >
      <div className="mb-1.5 flex items-baseline justify-between gap-6">
        <span className="nm-eyebrow">Downlink</span>
        <span className="nm-eyebrow text-ink-faint">Mbps</span>
      </div>

      <div
        className="h-2 w-40 border border-hairline-strong"
        style={{ background: signalGradientCss() }}
      />

      {/* tick marks */}
      <div className="mt-1 flex w-40 justify-between">
        <span className="nm-readout text-[9px] text-ink-faint">0</span>
        <span className="nm-readout text-[9px] text-ink-faint">75</span>
        <span className="nm-readout text-[9px] text-ink-faint">150</span>
      </div>

      <div className="mt-1 flex w-40 justify-between">
        <span className="nm-eyebrow text-[9px] text-ink-faint">Low</span>
        <span className="nm-eyebrow text-[9px] text-ink-faint">High</span>
      </div>
    </div>
  );
}
