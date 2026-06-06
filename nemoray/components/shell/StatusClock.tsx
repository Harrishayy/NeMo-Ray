"use client";

import { useEffect, useState } from "react";

/** Live UTC-ish clock. Renders an em-dash until mounted to avoid hydration drift. */
export function StatusClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const update = () => setNow(new Date());
    // Defer the first tick so we don't set state synchronously inside the effect.
    const first = setTimeout(update, 0);
    const t = setInterval(update, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, []);

  const time = now
    ? now.toLocaleTimeString("en-GB", { hour12: false })
    : "--:--:--";
  const date = now
    ? now
        .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
        .toUpperCase()
    : "-- --- ----";

  return (
    <div className="flex items-center gap-2.5">
      <span className="nm-readout text-sm text-ink tabular-nums">{time}</span>
      <span className="nm-eyebrow text-ink-faint">{date} · BST</span>
    </div>
  );
}
