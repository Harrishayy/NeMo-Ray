# NeMo-Ray

> Scaffold — populate as the project takes shape.

## Overview

**NeMo-Ray** is a GPU-accelerated **digital twin of the UK Emergency Services
Network (ESN) 4G/LTE coverage**, with an **agentic optimisation-and-resilience
layer** on top — *"the ESN coverage-and-resilience problem, made interactive."*
It simulates real coverage (NVIDIA **Sionna RT**), optimises where to add masts
(**cuOpt**), and uses **Nemotron** to reality-check each proposal against
real-world LiDAR before a planner trusts it — all running locally on a DGX Spark.

- **Product brief & architecture:** [`docs/BRIEF.md`](docs/BRIEF.md)
- **Hackathon tracks & scoring rubric:** [`docs/JUDGING.md`](docs/JUDGING.md)
  — targets: **Track 3 (Urban Operations)** + **Best Use of NVIDIA Nemotron**.
- **How to contribute (collaborators):** [`CONTRIBUTING.md`](CONTRIBUTING.md)

## Structure

- `nemoray/` — Next.js 16 app (App Router, TypeScript, Tailwind). Self-contained:
  its pnpm workspace and lockfile live inside `nemoray/` so collaborators can
  install and run it without touching the repo root. See `nemoray/CLAUDE.md`.
- `modellingsim/` — directory reserved for the modelling & simulation pipeline.
  Empty for now; wire it into the uv workspace when it gains a `pyproject.toml`.
- Python tooling for the whole repo is managed by **uv** (root `pyproject.toml`).

## Working in this repo

```bash
# Next.js app
cd nemoray && pnpm install && pnpm dev

# Python environment (from the repo root)
uv sync          # create .venv + install dev tooling
uv run ruff check
```

## Conventions

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for setup, repo layout, secrets/data
handling, branching, Conventional-Commit style, and PR process. Note: commits
are authored as a single human — **no AI `Co-Authored-By` trailers.**
