import { delay, postJson } from "@/lib/api/client";
import { USE_MOCK } from "@/lib/config";
import { computeMockRadioMap } from "@/lib/mock/radioMap";
import type { RadioMap, ScenarioId, SiteId } from "@/lib/types";

/**
 * The swap seam. In mock mode the radio map is computed locally (instant,
 * offline); in real mode it's requested from `/api/coverage`, which proxies the
 * DGX-Spark Sionna RT pipeline. Both return an identical {@link RadioMap}.
 */
export async function getRadioMap(
  scenarioId: ScenarioId,
  deactivatedSiteIds: SiteId[],
): Promise<RadioMap> {
  if (USE_MOCK) {
    // A touch of latency so the "computing…" state is visible on deactivation.
    await delay(280);
    return computeMockRadioMap(scenarioId, deactivatedSiteIds);
  }
  return postJson<RadioMap>("/api/coverage", { scenarioId, deactivatedSiteIds });
}
