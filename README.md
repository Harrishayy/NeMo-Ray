# NeMo-Ray

A Next.js application.

## Structure

```
NeMo-Ray/
├── nemoray/        # Next.js 16 app (App Router, TypeScript, Tailwind)
│   ├── app/        # routes, layouts, pages
│   ├── public/     # static assets
│   └── ...         # self-contained pnpm workspace + lockfile
├── modellingsim/   # reserved for the modelling & simulation pipeline (empty)
├── pyproject.toml  # uv config for the whole repo (Python tooling)
├── CLAUDE.md       # repo guidance for Claude Code
└── README.md
```

The pnpm workspace and lockfile live **inside `nemoray/`**, so the app is
self-contained — collaborators can install and run it without any root-level
package manager setup. Python tooling for the repo is managed by
[uv](https://docs.astral.sh/uv/) at the root.

## Prerequisites

- [Node.js](https://nodejs.org/) >= 20
- [pnpm](https://pnpm.io/) >= 10 (`corepack enable` or `npm i -g pnpm`)
- [uv](https://docs.astral.sh/uv/) (for the Python side)

## Getting started

```bash
git clone https://github.com/Harrishayy/NeMo-Ray.git
cd NeMo-Ray

# Python environment (from the repo root)
uv sync                  # create .venv + install dev tooling

# Next.js app
cd nemoray
pnpm install             # install dependencies
pnpm dev                 # start the dev server at http://localhost:3000
```

## Scripts

Run these from the `nemoray/` directory:

| Command       | Description                          |
| ------------- | ------------------------------------ |
| `pnpm dev`    | Start the dev server (Turbopack)     |
| `pnpm build`  | Create a production build            |
| `pnpm start`  | Serve the production build           |
| `pnpm lint`   | Lint with ESLint                     |

## License

TBD
