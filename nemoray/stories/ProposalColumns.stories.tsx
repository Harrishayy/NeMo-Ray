import type { Meta, StoryObj } from '@storybook/react';
import ProposalColumns from '../components/map/ProposalColumns';
import { LONDON_DEAD_ZONES } from '../lib/data/mockSionna';
import { generateProposals } from '../lib/data/mockProposals';

const meta: Meta<typeof ProposalColumns> = {
  title: 'Map/ProposalColumns',
  component: ProposalColumns,
};
export default meta;
type Story = StoryObj<typeof ProposalColumns>;

export const Default: Story = {
  args: { proposals: generateProposals(LONDON_DEAD_ZONES), map: null },
};
