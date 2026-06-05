# NeMo-Ray — Project Brief

> **One-liner:** *The ESN coverage-and-resilience problem, made interactive.*
>
> A GPU-accelerated **digital twin of the UK Emergency Services Network (ESN)**
> 4G/LTE coverage, with an **agentic optimisation-and-resilience layer** on top
> that proposes — and reality-checks — where to add capacity.

This brief is deliberately high-level. Treat `TODO` markers as open decisions to
fill in as the build firms up.

> **Nothing here is set in stone.** The named tools, data sources, APIs and
> links below are a **suggested starting point**, not requirements. If you know a
> better library, dataset, model, or approach — use it. Don't let these choices
> narrow your thinking or block your own knowledge; they're scaffolding to swap
> out freely, not a spec to conform to.

## The problem

The UK is replacing **Airwave** (the TETRA radio network behind every police,
fire and ambulance service) with **ESN**, a mission-critical service riding on
EE's commercial 4G network. The hard part isn't the masts — it's **coverage and
resilience**: ESN has to match Airwave's ~97% *landmass* coverage, but a
commercial network is built for *population* coverage, leaving rural and remote
gaps. The UK is already exploring satellite direct-to-device (e.g. Starlink) to
plug the holes.

We make that problem **interactive**: simulate real coverage, find the dead
zones, optimise where new capacity should go, and validate each proposal against
the real world before anyone trusts it.

## How it works (the pipeline)

```
 Real-world data  ─►  Coverage twin  ─►  Optimisation  ─►  Agentic reality-check  ─►  Interactive UI
 (cell towers,        (Sionna RT,         (cuOpt: where      (Nemotron: is this        (Next.js map +
  buildings)           radio maps)          to add masts)      site actually viable?)     proposals)
```

1. **Ingest** — build the input world from open data:
   - **OpenCellID** (start here): largest open cell-tower DB. UK is MCC `234`
     (file `234.csv`). Filter to **LTE + EE's MNCs** to get the 4G mast set.
   - **Building / terrain geometry** from OpenStreetMap.
   - Cross-reference / sanity-check: CellMapper, UKCellNet RF Map, Ofcom base-station map.
   - *TODO: decide the exact London bounding box + which EE MNCs we include.*

2. **Coverage twin → [NVIDIA Sionna RT](https://developer.nvidia.com/sionna)** —
   GPU-accelerated, differentiable ray-tracing for radio-wave propagation.
   Computes **radio maps** (coverage / power maps) directly over the scene.
   Reference: NVIDIA's `sionna-large-radio-maps` repo computes coverage maps from
   OpenCellID + OSM. This is our simulation engine.

3. **Optimisation → [NVIDIA cuOpt](https://developer.nvidia.com/cuopt)** —
   given the dead zones the twin reveals, propose **where to place new masts**
   to maximise coverage gain under constraints (count, spacing, terrain).

4. **Agentic reality-check → [NVIDIA Nemotron](https://www.nvidia.com/en-us/ai-data-science/foundation-models/nemotron/)** —
   the orchestrator. For each coordinate cuOpt proposes, Nemotron *validates it
   against the real world* before accepting it. Example loop:
   > "Location rejected — LiDAR shows a 15 m dense vegetation canopy breaking
   > line-of-sight. Re-prompting cuOpt for a rooftop alternative."
   - Validation source: a LiDAR / Street-View-style insights API
     (*TODO: confirm provider + access — Google Street View Insights or equivalent*).

5. **Interactive UI → `nemoray/` (Next.js)** — a map that shows current coverage,
   the gaps, the optimiser's proposals, and Nemotron's accept/reject reasoning.

## Why DGX Spark (the "Spark story")

Everything runs **locally** on the DGX Spark — no cloud LLM calls.
- **128 GB unified memory** holds the ray-tracing scene/radio-map buffers *and*
  the Nemotron context simultaneously, so the optimise→validate loop stays
  in-memory instead of round-tripping.
- Local inference = privacy + low latency for the agentic reality-check loop.
- *TODO: capture concrete numbers — sim resolution, real-time speedup, tokens.*

## NVIDIA stack used

*(Suggested tooling — substitute anything better. The one firm-ish constraint is
that leaning on the NVIDIA ecosystem scores heavily in the rubric; beyond that,
pick what works.)*

| Layer            | Tool            | Role                                            |
| ---------------- | --------------- | ----------------------------------------------- |
| Propagation sim  | **Sionna RT**   | Coverage / radio maps over the 3D scene          |
| Optimisation     | **cuOpt**       | Where to place new masts to close gaps           |
| Agent / orchestr | **Nemotron**    | Reality-checks proposals, drives the loop        |
| Hardware         | **DGX Spark**   | Runs the whole pipeline locally                  |

## Targets

- **Track 3 — Urban Operations** (optimising how London runs behind the scenes).
- **Best Use of NVIDIA Nemotron** bounty → **RTX 5080**.
- *Stretch:* ElevenLabs bounty — a voice front-end on the Nemotron agent that
  runs persistently ≥ 1h11m. *TODO: decide if in scope.*

See [`JUDGING.md`](./JUDGING.md) for the full scoring rubric and how each piece
above maps to points.
