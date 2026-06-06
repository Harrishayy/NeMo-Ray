"use client";

import { useKpis } from "@/store";
import { cn } from "@/lib/cn";
import { KpiCard } from "./KpiCard";

/** Stack of KPI cards (single column, 2-col on taller/wider rails). */
export function KpiGrid({ className }: { className?: string }) {
  const kpis = useKpis();
  return (
    <div className={cn("grid grid-cols-1 gap-2 @lg:grid-cols-2", className)}>
      {kpis.map((kpi) => (
        <KpiCard key={kpi.id} kpi={kpi} />
      ))}
    </div>
  );
}
