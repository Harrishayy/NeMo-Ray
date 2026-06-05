# Hackathon — Tracks & Judging

Reference copy of the rubric we're building against, plus how NeMo-Ray maps onto
it. **Primary targets: Track 3 (Urban Operations) + Best Use of NVIDIA Nemotron.**

> The rubric itself is fixed (it's the judges'). Everything in the **"How
> NeMo-Ray scores"** section below is just *our current read* on how to win
> points — a suggestion, not a constraint. If you see a stronger way to satisfy
> a criterion, take it.

## Challenge tracks

Each track is a *theme of impact*, not a scope limit — any solution may use any
of the open datasets.

1. **Economic Systems** — improving how money flows through the city across
   businesses, workers and markets; agentic systems for better economic
   decisions, unlocking opportunity, optimising cost.
2. **Public Services** — enhancing how people access and interact with city
   services; tools that simplify navigating public systems.
3. **Urban Operations** *(our track)* — optimising how London runs, from
   large-scale infrastructure to everyday city life; systems that improve how
   the city functions behind the scenes and in real time.

## Bounties

- **Best Use of NVIDIA Nemotron** *(our target — prize: RTX 5080)*.
- **ElevenLabs Prize** *(stretch)* — an autonomous agent running persistently
  for ≥ **1h11m** during the event, powered by NVIDIA Nemotron / NemoClaw, with
  an **ElevenLabs voice interface** for input *and* output. Submit session logs;
  judges test live by asking it about earlier events to evaluate long-term
  context retention.

## Judging philosophy

> We are judging **Systems Engineering**. A winning project is a **functioning
> system that ingests raw data, processes it locally on the DGX Spark, and
> produces a valuable result** — not a slide deck or a simple API wrapper.

## Scoring (100 points)

### 1. Technical Execution & Completeness — 30 pts
- **15 — Completeness:** the system completes the full data workflow without crashing.
- **15 — Technical Depth:** real engineering under the hood (Simulation, RAG,
  Fine-Tuning, or custom logic) — not a static dashboard or basic API wrapper.

### 2. NVIDIA Ecosystem & Spark Utility — 30 pts
- **15 — The Stack:** used ≥ 1 major NVIDIA library/tool (NIMs, RAPIDS, **cuOpt**,
  Modulus, **NeMo / Nemotron** models). *Merely calling GPT-4 via API → 0 here.*
- **15 — The "Spark Story":** can articulate **why this runs better on a DGX
  Spark** (e.g. 128 GB unified memory holds sim buffers + LLM context at once;
  local inference for privacy/latency).

### 3. Value & Impact — 20 pts
- **10 — Insight Quality:** non-obvious and valuable (not "traffic jams at 5pm").
- **10 — Usability:** a real city planner could use it to make a decision tomorrow.

### 4. Innovation & Execution — 20 pts
- **10 — Creativity:** novel combination of data/models.
- **10 — Performance:** optimised for speed or scale (e.g. "50x real-time sim").

## How NeMo-Ray scores

| Criterion              | Our story |
| ---------------------- | --------- |
| Completeness           | Full pipeline: open data → Sionna twin → cuOpt → Nemotron validation → UI |
| Technical Depth        | GPU ray-traced propagation sim + combinatorial optimisation + agentic validation loop |
| The Stack              | **Sionna RT + cuOpt + Nemotron** — three NVIDIA tools, not one |
| Spark Story            | 128 GB unified memory holds radio-map buffers **and** Nemotron context; all local |
| Insight Quality        | Non-obvious: *where* to add capacity **and** *why a site fails* (LiDAR line-of-sight) |
| Usability              | A planner sees gaps, proposals, and accept/reject reasoning on one map |
| Creativity             | Telecom propagation sim + optimiser + LLM reality-check against LiDAR |
| Performance            | *TODO: capture the real-time / throughput numbers* |

See [`BRIEF.md`](./BRIEF.md) for the architecture these map to.
