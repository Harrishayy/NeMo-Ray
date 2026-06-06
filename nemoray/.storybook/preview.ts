import type { Preview } from '@storybook/react';
// Load the HUD design tokens + utilities so primitive stories render on-brand.
import '../app/globals.css';

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
  },
};

export default preview;
