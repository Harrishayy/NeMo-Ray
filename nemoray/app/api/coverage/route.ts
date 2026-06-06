import { API_BASE, USE_MOCK } from "@/lib/config";
import { computeMockRadioMap } from "@/lib/mock/radioMap";
import type { ScenarioId, SiteId } from "@/lib/types";

export const dynamic = "force-dynamic";

interface CoverageBody {
  scenarioId: ScenarioId;
  deactivatedSiteIds: SiteId[];
}

/**
 * Coverage endpoint. Mock mode returns the local Sionna stand-in; real mode
 * proxies the DGX-Spark Sionna RT pipeline. Same {@link RadioMap} shape either
 * way. (In mock mode the client computes locally and rarely hits this route.)
 */
export async function POST(req: Request): Promise<Response> {
  const body = (await req.json().catch(() => null)) as CoverageBody | null;
  if (!body) return new Response("bad request", { status: 400 });

  if (!USE_MOCK && API_BASE) {
    const upstream = await fetch(`${API_BASE}/coverage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return new Response(upstream.body, {
      status: upstream.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  const radioMap = computeMockRadioMap(body.scenarioId, body.deactivatedSiteIds ?? []);
  return Response.json(radioMap);
}
