"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Bot, Radio, Layers, Target } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Workspace } from "@/lib/types";

interface Tab {
  id: Workspace;
  href: string;
  label: string;
  icon: LucideIcon;
}

const TABS: Tab[] = [
  { id: "mission", href: "/mission", label: "Mission Control", icon: Activity },
  { id: "coverage", href: "/coverage", label: "Coverage Twin", icon: Layers },
  { id: "optimiser", href: "/optimiser", label: "cuOpt Optimiser", icon: Target },
  { id: "agent", href: "/agent", label: "AI Agent", icon: Bot },
  { id: "scenarios", href: "/scenarios", label: "Scenarios", icon: Radio },
];

export function WorkspaceTabs() {
  const pathname = usePathname();

  return (
    <nav className="relative z-10 flex h-9 shrink-0 items-stretch gap-px border-b border-hairline bg-bg-2/60 px-2">
      {TABS.map((tab) => {
        const active = pathname.startsWith(tab.href);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={cn(
              "group relative flex items-center gap-2 px-3 text-[11px] font-medium uppercase tracking-[0.14em] transition-colors",
              active ? "text-nv" : "text-ink-dim hover:text-ink",
            )}
          >
            {/* active corner ticks */}
            {active && (
              <>
                <span className="absolute left-0 top-0 h-1.5 w-1.5 border-l border-t border-nv" />
                <span className="absolute bottom-0 right-0 h-1.5 w-1.5 border-b border-r border-nv" />
                <span className="absolute inset-x-0 bottom-0 h-px bg-nv shadow-[0_0_8px_var(--color-nv-glow)]" />
                <span className="absolute inset-0 -z-10 bg-nv/[0.06]" />
              </>
            )}
            <Icon size={13} className={active ? "text-nv" : "text-ink-faint group-hover:text-ink-dim"} />
            <span className="hidden sm:inline">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
