# Contributing to NeMo-Ray

Welcome. This guide gets a collaborator (human or another Claude instance)
productive fast. Read [`docs/BRIEF.md`](./docs/BRIEF.md) for *what* we're
building and [`docs/JUDGING.md`](./docs/JUDGING.md) for *what we're optimising
for*. **We are building for Track 3 (Urban Operations) + the NVIDIA Nemotron
bounty** — keep that lens when making trade-offs.

> **The docs describe a direction, not a contract.** Specific tools, datasets,
> APIs, file layouts and links across these docs are suggested starting points —
> swap in anything better and stay open-minded. The only things to treat as
> fixed are the prize targets and the judges' rubric; the rest is yours to
> improve. Don't let a named choice here override your own knowledge.
>
> **Scope of that freedom:** it covers *product and tooling* choices. The UI has a
> small set of code-level **locked invariants** (e.g. Cesium needs `reactStrictMode:
> false`, the map seam, the Zustand backbone) recorded in
> [`nemoray/docs/INVARIANTS.md`](./nemoray/docs/INVARIANTS.md) — each with a *why* and
> an explicit-intent escape hatch. Don't cite this paragraph to justify flipping one of
> those without saying so. Design language lives in
> [`nemoray/docs/DESIGN-SYSTEM.md`](./nemoray/docs/DESIGN-SYSTEM.md).

## TL;DR for a new Claude instance

1. Read `CLAUDE.md`, `docs/BRIEF.md`, `docs/JUDGING.md` before touching code.
2. The repo has two halves: **`nemoray/`** (Next.js UI) and **`modellingsim/`**
   (the Python GPU pipeline — Sionna / cuOpt / Nemotron). Work in the half your
   task belongs to.
3. Never commit secrets or large data files (see [Secrets & data](#secrets--data)).
4. Branch, commit in Conventional-Commit style, open a PR. Don't push to `main`.

## Repository layout

```
NeMo-Ray/
├── nemoray/         # Next.js 16 app (App Router, TS, Tailwind) — interactive map/UI
│                    #   self-contained pnpm workspace + lockfile live here
├── modellingsim/    # Python GPU pipeline (Sionna RT, cuOpt, Nemotron) — currently a stub
├── docs/            # BRIEF.md (product), JUDGING.md (rubric)
├── pyproject.toml   # uv config for the whole repo (Python tooling)
├── CLAUDE.md        # guidance for Claude Code
└── CONTRIBUTING.md  # this file
```

Workstreams map cleanly to the pipeline stages in `docs/BRIEF.md`:

| Stage                     | Lives in        | Owner (fill in) |
| ------------------------- | --------------- | --------------- |
| Data ingest (OpenCellID, OSM) | `modellingsim/` | TODO |
| Coverage twin (Sionna RT) | `modellingsim/` | TODO |
| Optimisation (cuOpt)      | `modellingsim/` | TODO |
| Agentic reality-check (Nemotron) | `modellingsim/` | TODO |
| Interactive UI            | `nemoray/`      | TODO |

## Getting started

### Prerequisites
- [Node.js](https://nodejs.org/) >= 20 and [pnpm](https://pnpm.io/) >= 10
  (`corepack enable`)
- [uv](https://docs.astral.sh/uv/) for Python
- For the GPU pipeline: an NVIDIA GPU / **DGX Spark** with the appropriate
  CUDA + Sionna stack. *TODO: pin exact versions once the pipeline lands.*

### Setup

```bash
# Python tooling (from repo root)
uv sync                  # creates .venv + installs dev tooling

# Next.js app
cd nemoray
pnpm install
pnpm dev                 # http://localhost:3000
```

`modellingsim/` is an empty stub today. When it gains a `pyproject.toml`, wire it
into the uv workspace at the root rather than giving it a separate venv.

## Secrets & data

- **Never commit** API keys, tokens, or `.env` files. Use a local `.env`
  (gitignored) and document new variables in this section.
- **Never commit** bulk datasets (e.g. OpenCellID `234.csv`, OSM extracts, radio
  maps). Keep them out of git; document where to fetch them instead.
- Known external services that need credentials (*confirm/extend*):
  - OpenCellID API token (or download `234.csv` directly).
  - LiDAR / Street-View insights provider for the Nemotron reality-check — *TODO*.
- *TODO: add a `.env.example` listing required variable names (no values).*

## Branching & commits

- Branch off `main`: `feat/<thing>`, `fix/<thing>`, `docs/<thing>`,
  `chore/<thing>`.
- Use **Conventional Commits**: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`,
  `perf:`, `test:`. Keep the subject imperative and under ~72 chars.
- Write commit messages as a single human author. **Do not add AI co-author /
  `Co-Authored-By` trailers.**
- One logical change per commit; keep PRs focused.

## Pull requests

- Open a PR into `main`; don't push directly.
- In the description: what changed, why, how you tested it, and which pipeline
  stage / judging criterion it advances.
- Make sure `pnpm lint` (in `nemoray/`) and `uv run ruff check` (root) pass.
- Keep the demo runnable on `main` at all times — a working end-to-end path
  beats a half-finished feature (see the rubric's *Completeness* points).

## Definition of done (hackathon lens)

A change is "done" when it moves us toward a **working system that ingests raw
data, processes it locally on the DGX Spark, and produces a valuable result**.
Prefer a thin end-to-end slice that runs over a deep feature that doesn't.
