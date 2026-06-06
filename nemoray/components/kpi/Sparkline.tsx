import { useId } from "react";
import { cn } from "@/lib/cn";

type SparkState = "nominal" | "warning" | "critical";

const STROKE: Record<SparkState, string> = {
  nominal: "var(--color-nv)",
  warning: "var(--color-warning)",
  critical: "var(--color-critical)",
};

/**
 * Hand-rolled SVG sparkline — no chart lib. Normalises `data` to its own range,
 * draws a crisp polyline with a faint gradient area fill and a glowing end-dot.
 * Width is fluid (viewBox + non-uniform preserveAspectRatio); height is fixed.
 */
export function Sparkline({
  data,
  state = "nominal",
  className,
  width = 240,
  height = 36,
}: {
  data: number[];
  state?: SparkState;
  className?: string;
  width?: number;
  height?: number;
}) {
  const uid = useId();
  const gradId = `spark-fill-${uid}`;
  const stroke = STROKE[state];

  // Inset so the stroke + end-dot never clip at the edges.
  const padX = 1.5;
  const padY = 3;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  const n = data.length;
  if (n === 0) {
    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        preserveAspectRatio="none"
        className={cn("block", className)}
        aria-hidden
      />
    );
  }

  let min = data[0];
  let max = data[0];
  for (const v of data) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const span = max - min || 1;

  const xFor = (i: number) => (n === 1 ? padX : padX + (i / (n - 1)) * innerW);
  const yFor = (v: number) => padY + (1 - (v - min) / span) * innerH;

  const points = data.map((v, i) => `${xFor(i).toFixed(2)},${yFor(v).toFixed(2)}`);
  const linePath = `M${points.join(" L")}`;
  const lastX = xFor(n - 1);
  const lastY = yFor(data[n - 1]);
  const baseline = height - padY;
  const areaPath = `${linePath} L${lastX.toFixed(2)},${baseline} L${padX.toFixed(2)},${baseline} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      preserveAspectRatio="none"
      className={cn("block overflow-visible", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity={0.28} />
          <stop offset="100%" stopColor={stroke} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} stroke="none" />
      <path
        d={linePath}
        fill="none"
        stroke={stroke}
        strokeWidth={1.25}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={lastX} cy={lastY} r={3.5} fill={stroke} opacity={0.18} />
      <circle
        cx={lastX}
        cy={lastY}
        r={1.6}
        fill={stroke}
        style={{ filter: `drop-shadow(0 0 3px ${stroke})` }}
      />
    </svg>
  );
}
