import type { Meta, StoryObj } from '@storybook/react';
import DeadZoneLayer from '../components/map/DeadZoneLayer';
import { LONDON_DEAD_ZONES } from '../lib/data/mockSionna';

const meta: Meta<typeof DeadZoneLayer> = {
  title: 'Map/DeadZoneLayer',
  component: DeadZoneLayer,
};
export default meta;
type Story = StoryObj<typeof DeadZoneLayer>;

export const Default: Story = {
  args: { deadZones: LONDON_DEAD_ZONES, map: null },
};
