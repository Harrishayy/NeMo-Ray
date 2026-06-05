# NeMo-Ray

> Scaffold — populate as the project takes shape.

## Overview

<!-- One or two sentences on what this repo is and does. -->

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

<!-- Coding standards, branch naming, commit etiquette, review process, etc. -->
