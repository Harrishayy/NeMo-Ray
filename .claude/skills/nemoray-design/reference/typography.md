# Typography

**Manrope** for display + UI (a clean humanist sans standing in for NVIDIA's proprietary
NVIDIA Sans), **JetBrains Mono** for every numeric readout, timestamp and coordinate. The
**eyebrow** — a tracked, uppercased micro-label — introduces every panel, field and KPI.

> **Source of truth:** `tokens/typography.css`. Fonts should be loaded by the consuming app
> (e.g. `next/font`) and bound to `--font-sans` / `--font-mono`; swap in licensed NVIDIA
> Sans `.woff2` files there if available.

## Families

| Token | Stack |
| --- | --- |
| `--font-sans` / `--font-display` | `"Manrope", ui-sans-serif, system-ui, …` |
| `--font-mono` | `"JetBrains Mono", ui-monospace, "SFMono-Regular", "Menlo", …` |

## Weights

`--weight-light` 300 · `--weight-regular` 400 · `--weight-medium` 500 ·
`--weight-semibold` 600 · `--weight-bold` 700 · `--weight-extrabold` 800.
Use 700/800 for titles, 400/500 for body.

## Type scale (px)

| Token | Size | Use |
| --- | --- | --- |
| `--text-display-xl` | 56 | Hero KPI numerals |
| `--text-display-lg` | 40 | |
| `--text-display-md` | 32 | |
| `--text-title` | 24 | Panel / section titles |
| `--text-lg` | 20 | |
| `--text-md` | 16 | Body large |
| `--text-base` | 14 | Body default |
| `--text-sm` | 13 | |
| `--text-xs` | 12 | |
| `--text-2xs` | 11 | |
| `--text-3xs` | 10 | Eyebrows, ticks |

## Line height & letter spacing

- **Leading:** `--leading-tight` 1.15 · `--leading-snug` 1.35 · `--leading-normal` 1.6 ·
  `--leading-relaxed` 1.75. Tight for display headlines, normal for body.
- **Tracking:** `--tracking-tight` −0.02em · `--tracking-snug` −0.01em ·
  `--tracking-normal` 0 · `--tracking-wide` 0.02em · `--tracking-eyebrow` 0.12em ·
  `--tracking-caps` 0.04em.

## Text-rhythm tokens (drive `.nm-prose`)

`--space-eyebrow-head` 12px · `--space-head-body` 20px · `--space-para` 16px ·
`--space-section` 56px · `--measure-prose` 62ch.

## Reusable text classes

| Class | What it is |
| --- | --- |
| `.nm-eyebrow` | The signature micro-label — Manrope, bold, uppercase, `--tracking-eyebrow`, 10px, colour `--text-label`. Put one on every panel/field/KPI. |
| `.nm-readout` | Tabular mono for any numeric telemetry — JetBrains Mono + `tabular-nums` + `--tracking-snug`. |
| `.nm-prose` | Wrap related copy; eyebrow→headline→body margins resolve from the rhythm tokens above (never hand-set margins). |
| `.nm-headline` | Display headline inside prose — extrabold, tight leading/tracking, balanced wrap. |
