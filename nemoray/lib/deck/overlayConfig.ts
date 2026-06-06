import { MapboxOverlay } from '@deck.gl/mapbox';
import type { Layer } from '@deck.gl/core';

export function createDeckOverlay(layers: Layer[]) {
  return new MapboxOverlay({ interleaved: true, layers });
}
