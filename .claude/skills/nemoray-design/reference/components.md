# Components

The class-based styling for every primitive lives in `styles/components.css`; the table
below documents each component's role, its `.nm-*` classes, and the props the reference
implementation exposes. Resting surfaces and status stay neutral — **green marks primary
actions, active/live state and focus only.**

> These are **specs**, not shipped code. In the NeMo-Ray app the live implementations are
> React/TypeScript primitives in `nemoray/components/primitives/` (Radix-backed for
> Toggle/Slider/Dialog/Tooltip); they render these same `.nm-*` classes.

---

## Button — `.nm-btn`

Primary action. Uppercase, tracked label.

- **Variants** (`.nm-btn--{variant}`): `solid` (green primary commit) · `outline`
  (secondary) · `ghost` (quiet) · `danger` (destructive).
- **Sizes** (`.nm-btn--{size}`): `sm` (30px) · `md` (36px) · `lg` (44px).
- Focus ring = 2px offset + green outline. Disabled = 40% opacity.

## Panel — `.nm-card-root` (+ `.nm-card-header`, `.nm-card-tick`, `.nm-card-title`, `.nm-card-body`)

The framed slate surface holding everything. Soft-rounded card with an optional titled
header; the small green **tick** beside the title is the panel signature.

- **Props:** `title`, `eyebrow`, `actions`, `interactive`, `active`, `noPadding`.
- `--interactive` adds hover lift; `--active` adds the soft accent ring (`--glow-accent`).

## Badge — `.nm-badge`

Small **rectangular** label for states, counts and tags (not a pill).

- **Tones** (`.nm-badge--{tone}`): `solid` (brand-green chip) · `nominal` · `warning` ·
  `critical` · `info`. Default (no modifier) = neutral.

## StatusDot — `.nm-dot`

Atomic operational-state pip.

- **States** (`.nm-dot--{state}`): `nominal` · `warning` · `critical` · `info` · `idle`.
- Add `.nm-pulse` for live/critical signals.

## Readout — `.nm-readout-block` (+ `.nm-readout-value`, `.nm-readout-unit`, `.nm-delta`)

Labelled tabular-mono numeric — the unit of telemetry display.

- **Props:** `label`, `value`, `unit`, `delta`, `deltaDir` (`up`/`down`/`flat`), `size`
  (`sm` 18 / `md` 24 / `lg` 34 / `xl` 48 px).
- Pairs a `.nm-eyebrow` label with a tabular value + optional unit and a trend delta chip
  (`.nm-delta--up|down|flat`).

## KpiStat

Hero metric tile built on `Panel`. Big tabular numeral, a status dot, a trend delta and an
optional sparkline.

- **Props:** `eyebrow`, `value`, `unit`, `status`, `delta`, `deltaDir`, `spark` (array of
  0–1 values rendered as mini bars; the last bar is green-highlighted).

## Toggle — `.nm-switch` (+ `.nm-switch-knob`)

Compact switch. Pill track with a round knob that turns green when on.

- **Props:** `checked` / `defaultChecked`, `onChange`, `disabled`.
- On-state keyed off `[data-on="true"]` (or, for Radix, `[data-state="checked"]`).

## Slider — `.nm-slider` (+ `.nm-slider-track`, `.nm-slider-range`, `.nm-slider-thumb`)

Thin range control with a green fill and a round green-ringed thumb.

- **Props:** `min`, `max`, `step`, `value` / `defaultValue`, `onChange`, `disabled`.

## SegmentedControl — `.nm-tabs` (+ `.nm-tab`)

Compact tab strip for switching views/modes.

- **Props:** `options` (`[{ value, label }]`), `value` / `defaultValue`, `onChange`.
- Active tab keyed off `[data-active="true"]` — green fill, dark text.

## LayerToggle — `.nm-layer` (+ `.nm-layer-head`, `.nm-layer-label`)

Map-layer row: optional swatch + icon + label + count, with a `Toggle`. Dims to 50% when
off; shows a green left-rail accent when on.

- **Props:** `icon`, `label`, `count`, `on`, `onChange`, `swatch`.
- On/off keyed off `[data-on]`.

## ToolCard — `.nm-tool` (+ `.nm-tool-head`, `.nm-tool-label`, `.nm-tool-status`, `.nm-tool-bar`, `.nm-tool-fill`, `.nm-tool-result`)

A single agent tool invocation: name, live status, optional progress bar (while running),
and a mono result line. The border tracks status.

- **Props:** `icon`, `name`, `status` (`queued`/`running`/`success`/`error`), `progress`
  (0–1), `result`.
- Status keyed off `[data-status]`.

## AgentMessage — `.nm-msg` (+ `.nm-msg-role`)

One line in the agent-console transcript.

- **Props:** `role` (`agent` / `operator` / `system`), `name`, `time`, `children`.
- **Roles** (`.nm-msg--{role}`): `agent` (green left rail + faint green wash) · `operator`
  (framed surface) · `system` (quiet mono).

## CoverageLegend

The downlink-bandwidth colour ramp with tick labels — shares `--signal-gradient` with the
map render so the legend always matches.

- **Props:** `min`, `max`, `unit` (default `Mbps`), `ticks` (default `[0,50,100,150]`).
- See [colours · signal ramp](colors.md#signal-ramp--downlink-bandwidth).
