/**
 * Runtime configuration + feature flags.
 *
 * The UI never branches on raw env vars directly — it reads these typed
 * constants so the mock↔real and placeholder↔deck swaps live in one place.
 */

/** When true, `lib/api/*` resolve against `lib/mock/*` instead of the backend. */
export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "false";

/** Which map implementation `MapMount` renders. */
export type MapImpl = "placeholder" | "deck";
export const MAP_IMPL: MapImpl =
  (process.env.NEXT_PUBLIC_MAP_IMPL as MapImpl) ?? "placeholder";

/** Base URL of the real DGX-Spark backend (FastAPI). Empty in mock mode. */
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

/** App identity shown in the chrome. */
export const APP = {
  org: "NeMo-Ray",
  product: "NeMo-Ray",
  title: "AI-RAN",
  subtitle: "DIGITAL TWIN // REAL-TIME",
  region: "London",
  network: "Emergency Services Network (ESN)",
  operator: "GPU Goblins",
} as const;
