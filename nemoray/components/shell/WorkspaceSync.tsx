"use client";

import { useEffect } from "react";
import { useNemoStore } from "@/store";
import type { Workspace } from "@/lib/types";

/** Lightweight per-page hook: marks the active workspace in the store on mount. */
export function WorkspaceSync({ workspace }: { workspace: Workspace }) {
  const setWorkspace = useNemoStore((s) => s.setWorkspace);
  useEffect(() => {
    setWorkspace(workspace);
  }, [workspace, setWorkspace]);
  return null;
}
