import { API_BASE, USE_MOCK } from "@/lib/config";
import { buildReply, buildSiteDownRun, type ScriptStep } from "@/lib/mock/agent";

export const dynamic = "force-dynamic";

interface AgentBody {
  prompt?: string;
  trigger?: { kind: "site_down"; siteId: string; siteName: string };
}

function scriptFor(body: AgentBody): ScriptStep[] {
  if (body.trigger?.kind === "site_down") {
    return buildSiteDownRun(body.trigger.siteId, body.trigger.siteName);
  }
  return buildReply(body.prompt ?? "");
}

/**
 * Streaming Nemotron endpoint (SSE). Mock mode replays scripted runs from
 * `lib/mock/agent.ts`; real mode proxies the DGX-Spark Nemotron service. The
 * wire protocol (`AgentStreamEvent` frames) is identical either way.
 */
export async function POST(req: Request): Promise<Response> {
  const body = (await req.json().catch(() => ({}))) as AgentBody;

  // Real backend: pass the SSE stream straight through.
  if (!USE_MOCK && API_BASE) {
    const upstream = await fetch(`${API_BASE}/agent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return new Response(upstream.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  }

  const steps = scriptFor(body);
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      for (const step of steps) {
        await new Promise((r) => setTimeout(r, step.delay));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(step.event)}\n\n`));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
