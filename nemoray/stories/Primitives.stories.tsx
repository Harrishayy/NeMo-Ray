import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import {
  Panel,
  PanelHeader,
  PanelBody,
  Button,
  Toggle,
  Slider,
  Readout,
  StatusDot,
  Tooltip,
  TooltipProvider,
  Dialog,
  formatCompact,
} from "../components/primitives";

/**
 * Living reference for the HUD primitives. These render the real components with real
 * tokens (globals.css is loaded in .storybook/preview.ts), so they stay in lockstep with
 * the design system — a story can't drift the way a Markdown screenshot would.
 * See docs/DESIGN-SYSTEM.md §3.
 */
const meta: Meta = {
  title: "Primitives/Overview",
  decorators: [
    (Story) => (
      <div
        style={{
          background: "var(--color-bg)",
          color: "var(--color-ink)",
          padding: 24,
          minHeight: 240,
        }}
      >
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj;

export const Buttons: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="ghost">Ghost</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="solid">Solid</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="outline" size="sm">
        Small
      </Button>
      <Button variant="outline" disabled>
        Disabled
      </Button>
    </div>
  ),
};

export const Readouts: Story = {
  render: () => (
    <div className="flex flex-wrap gap-8">
      <Readout label="Coverage" value="94.2" unit="%" />
      <Readout label="Active masts" value={formatCompact(168000)} />
      <Readout label="Dead zones" value={12} valueClassName="text-critical" />
    </div>
  ),
};

export const Statuses: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-6">
      {(["nominal", "warning", "critical", "info", "idle"] as const).map((s) => (
        <span key={s} className="flex items-center gap-2">
          <StatusDot status={s} pulse />
          <span className="eyebrow">{s}</span>
        </span>
      ))}
    </div>
  ),
};

export const PanelBlock: Story = {
  render: () => (
    <div className="w-[320px]">
      <Panel frame>
        <PanelHeader label="Network status" sub="ESN" right={<StatusDot status="nominal" pulse />} />
        <PanelBody className="space-y-2 p-3">
          <Readout label="Downlink" value="142" unit="Mbps" />
          <Readout label="Uptime" value="99.98" unit="%" />
        </PanelBody>
      </Panel>
    </div>
  ),
};

export const Controls: Story = {
  render: function ControlsStory() {
    const [on, setOn] = useState(true);
    const [v, setV] = useState(60);
    return (
      <div className="flex w-[280px] flex-col gap-4">
        <label className="flex items-center justify-between">
          <span className="eyebrow">Beams</span>
          <Toggle checked={on} onCheckedChange={setOn} aria-label="Toggle beams" />
        </label>
        <div className="flex flex-col gap-1">
          <span className="eyebrow">Opacity — {v}%</span>
          <Slider value={v} onValueChange={setV} aria-label="Opacity" />
        </div>
      </div>
    );
  },
};

export const Overlays: Story = {
  render: () => (
    <TooltipProvider>
      <div className="flex items-center gap-4">
        <Tooltip content="Reality-checked by Nemotron">
          <Button variant="outline">Hover me</Button>
        </Tooltip>
        <Dialog title="Validation verdict" trigger={<Button variant="solid">Open dialog</Button>}>
          <p className="text-sm text-ink-dim">
            A framed HUD modal built on the Dialog primitive.
          </p>
        </Dialog>
      </div>
    </TooltipProvider>
  ),
};
