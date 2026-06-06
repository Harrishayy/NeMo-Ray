import type { Meta, StoryObj } from '@storybook/react';
import CoverageHeatmap from '../components/map/CoverageHeatmap';
import { generateRadioMap } from '../lib/data/mockSionna';

const radioMap = generateRadioMap(42);

const meta: Meta<typeof CoverageHeatmap> = {
  title: 'Map/CoverageHeatmap',
  component: CoverageHeatmap,
};
export default meta;
type Story = StoryObj<typeof CoverageHeatmap>;

export const Default: Story = {
  args: { points: radioMap.points.slice(0, 500), map: null },
};
