import type { Meta, StoryObj } from "@storybook/react";
import { Activity, MessageSquare, Radio, Target } from "lucide-react";
import { useState } from "react";
import { RailTabs, type RailTab } from "../components/shell/RailTabs";

/**
 * Living reference for the rail tab strip. Each rail (left = context, right =
 * action) carries one of these so the operator can swap what the rail shows —
 * Network ↔ Scenarios on the left, Chat ↔ cuOpt on the right. See the
 * add-hud-panel skill and docs/DESIGN-SYSTEM.md.
 */
const meta: Meta<typeof RailTabs> = {
  title: "Shell/RailTabs",
  decorators: [
    (Story) => (
      <div
        style={{
          background: "var(--color-bg)",
          color: "var(--color-ink)",
          width: 320,
          padding: 1,
          minHeight: 120,
        }}
      >
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj;

const LEFT_TABS: RailTab<"network" | "scenarios">[] = [
  { id: "network", label: "Network", icon: Activity },
  { id: "scenarios", label: "Scenarios", icon: Radio },
];

const RIGHT_TABS: RailTab<"chat" | "cuopt">[] = [
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "cuopt", label: "cuOpt", icon: Target },
];

export const LeftRail: Story = {
  render: function LeftRailStory() {
    const [active, setActive] = useState<"network" | "scenarios">("network");
    return (
      <RailTabs<"network" | "scenarios">
        tabs={LEFT_TABS}
        active={active}
        onSelect={setActive}
        reserve="right"
      />
    );
  },
};

export const RightRail: Story = {
  render: function RightRailStory() {
    const [active, setActive] = useState<"chat" | "cuopt">("chat");
    return (
      <RailTabs<"chat" | "cuopt">
        tabs={RIGHT_TABS}
        active={active}
        onSelect={setActive}
        reserve="left"
      />
    );
  },
};
