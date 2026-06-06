import type { Meta, StoryObj } from '@storybook/react';
import MastMarkers from '../components/map/MastMarkers';
import { generateMastSites } from '../lib/data/mockCellTowers';

const meta: Meta<typeof MastMarkers> = {
  title: 'Map/MastMarkers',
  component: MastMarkers,
};
export default meta;
type Story = StoryObj<typeof MastMarkers>;

export const Default: Story = {
  args: { sites: generateMastSites(20), map: null },
};
