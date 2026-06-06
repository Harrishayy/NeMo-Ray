import type { AgentStreamEvent, ToolCall, ToolName } from "@/lib/types";

export interface ScriptStep {
  /** Delay (ms) to wait BEFORE emitting this event. */
  delay: number;
  event: AgentStreamEvent;
}

let counter = 0;
function uid(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}`;
}

/** Split text into word-ish chunks so streaming looks natural. */
function tokenize(text: string): string[] {
  return text.match(/\S+\s*/g) ?? [text];
}

function streamText(text: string, perToken = 26): ScriptStep[] {
  return tokenize(text).map((t) => ({ delay: perToken, event: { type: "token", text: t } }));
}

function tool(name: ToolName, label: string, args?: Record<string, unknown>): ToolCall {
  return { id: uid(`tc-${name}`), name, label, status: "queued", args, progress: 0 };
}

const TOOL_LABELS: Record<ToolName, string> = {
  diagnose_site: "Diagnose Site",
  predict_root_cause: "Predict Root Cause",
  activate_failover: "Activate Failover",
  run_cuopt: "Run cuOpt",
  validate_site: "Validate Site",
};

export function toolLabel(name: ToolName): string {
  return TOOL_LABELS[name];
}

/**
 * The headline auto-narration fired when an operator deactivates a site.
 * diagnose_site → predict_root_cause → activate_failover, interleaved with
 * streamed Nemotron commentary.
 */
export function buildSiteDownRun(siteId: string, siteName: string): ScriptStep[] {
  const messageId = uid("msg");
  const diagnose = tool("diagnose_site", TOOL_LABELS.diagnose_site, { siteId });
  const rootCause = tool("predict_root_cause", TOOL_LABELS.predict_root_cause, { siteId });
  const failover = tool("activate_failover", TOOL_LABELS.activate_failover, { siteId });

  return [
    { delay: 120, event: { type: "message_start", id: messageId, role: "agent" } },
    ...streamText(`Anomaly detected: severe coverage degradation at site ${siteId} (${siteName}). `),

    { delay: 260, event: { type: "tool_call", call: diagnose } },
    { delay: 240, event: { type: "tool_update", id: diagnose.id, patch: { status: "running", progress: 0.4 } } },
    ...streamText("Running diagnostics across neighbouring cells… "),
    { delay: 520, event: { type: "tool_update", id: diagnose.id, patch: { status: "success", progress: 1, result: "RSRP −118 dBm, 3 adjacent cells absorbing load" } } },

    { delay: 200, event: { type: "tool_call", call: rootCause } },
    { delay: 260, event: { type: "tool_update", id: rootCause.id, patch: { status: "running", progress: 0.5 } } },
    ...streamText("Root-cause prediction points to a backhaul link failure rather than RF fault. "),
    { delay: 560, event: { type: "tool_update", id: rootCause.id, patch: { status: "success", progress: 1, result: "Backhaul failure — 87% confidence" } } },

    { delay: 220, event: { type: "tool_call", call: failover } },
    { delay: 260, event: { type: "tool_update", id: failover.id, patch: { status: "running", progress: 0.6 } } },
    ...streamText("Recommended action: activate Starlink direct-to-device failover and notify the field team. "),
    { delay: 600, event: { type: "tool_update", id: failover.id, patch: { status: "success", progress: 1, result: "Failover armed — awaiting operator confirm" } } },

    ...streamText("Coverage hole contained. Standing by for your go-ahead to commit the failover."),
    { delay: 80, event: { type: "message_end", id: messageId } },
  ];
}

/** Generic streamed reply to an operator prompt. */
export function buildReply(prompt: string): ScriptStep[] {
  const messageId = uid("msg");
  const p = prompt.toLowerCase();

  let text: string;
  if (p.includes("coverage") || p.includes("gap") || p.includes("dead")) {
    text =
      "Current worst coverage sits south-west of the Westminster cell. If you take that hub offline, the twin shows a critical hole forming within ~250 m resolution. cuOpt can propose an infill mast — want me to run it?";
  } else if (p.includes("optimise") || p.includes("cuopt") || p.includes("mast") || p.includes("propose")) {
    text =
      "Running cuOpt against the live dead zones now. Two candidate rooftops maximise coverage gain under the spacing constraint; I'll validate each against LiDAR before recommending.";
  } else if (p.includes("failover") || p.includes("starlink")) {
    text =
      "Starlink direct-to-device failover is the fastest path to restore the affected sector. Latency cost is ~40 ms but it holds priority ESN traffic until backhaul is repaired.";
  } else if (p.includes("status") || p.includes("network") || p.includes("health")) {
    text =
      "Network availability is holding above target. The City of London cell is trending toward congestion at peak; everything else is nominal. No critical alerts beyond the ones shown.";
  } else {
    text =
      "Acknowledged. I'm watching the live twin — tell me a site to diagnose, ask for a coverage assessment, or have me run cuOpt for infill proposals.";
  }

  return [
    { delay: 120, event: { type: "message_start", id: messageId, role: "agent" } },
    ...streamText(text),
    { delay: 80, event: { type: "message_end", id: messageId } },
  ];
}
