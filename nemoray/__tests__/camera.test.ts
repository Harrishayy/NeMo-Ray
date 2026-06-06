import { CameraController } from '../lib/camera/CameraController';
import type { MapRef } from '../__mocks__/react-map-gl';

describe('CameraController', () => {
  function makeRef(mock: Partial<MapRef>) {
    return { current: mock as MapRef };
  }

  test('flyToProposal calls flyTo with correct center for INSPECT preset', () => {
    const flyTo = jest.fn();
    const ref = makeRef({ flyTo });
    const ctrl = new CameraController(ref as React.RefObject<MapRef | null>);
    ctrl.flyToProposal({ lat: 51.5, lng: -0.1 }, 'INSPECT');
    expect(flyTo).toHaveBeenCalledWith(
      expect.objectContaining({ center: [-0.1, 51.5], zoom: 16 })
    );
  });

  test('flyToOverview calls flyTo with London centre', () => {
    const flyTo = jest.fn();
    const ref = makeRef({ flyTo });
    const ctrl = new CameraController(ref as React.RefObject<MapRef | null>);
    ctrl.flyToOverview();
    expect(flyTo).toHaveBeenCalledWith(
      expect.objectContaining({ center: [-0.1278, 51.5074] })
    );
  });

  test('flyToProposal uses REJECTED_ZOOM preset correctly', () => {
    const flyTo = jest.fn();
    const ref = makeRef({ flyTo });
    const ctrl = new CameraController(ref as React.RefObject<MapRef | null>);
    ctrl.flyToProposal({ lat: 51.4, lng: -0.05 }, 'REJECTED_ZOOM');
    expect(flyTo).toHaveBeenCalledWith(
      expect.objectContaining({ center: [-0.05, 51.4], zoom: 17 })
    );
  });
});
