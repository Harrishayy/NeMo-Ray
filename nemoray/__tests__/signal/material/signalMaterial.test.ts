import {
  createSignalMaterial,
  updateSignalUniforms,
  SIGNAL_MATERIAL_TYPE,
} from '@/lib/cesium/signal/material/signalMaterial';

// ---------------------------------------------------------------------------
// Mock Cesium.Material — capture the fabric config without WebGL
// ---------------------------------------------------------------------------
let capturedFabric: Record<string, unknown> | undefined;

jest.mock('cesium', () => ({
  Material: jest.fn().mockImplementation(function (
    this: { uniforms: Record<string, unknown> },
    options: { fabric: { uniforms: Record<string, unknown> } },
  ) {
    capturedFabric = options.fabric;
    // Expose uniforms directly on the instance so updateSignalUniforms can
    // mutate them — matching the real Cesium.Material interface.
    this.uniforms = { ...(options.fabric.uniforms as Record<string, unknown>) };
  }),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  capturedFabric = undefined;
  jest.clearAllMocks();
});

describe('createSignalMaterial', () => {
  it('passes type "SignalFlow" to the Fabric config', () => {
    createSignalMaterial();
    expect(capturedFabric?.type).toBe('SignalFlow');
  });

  it('SIGNAL_MATERIAL_TYPE constant matches the Fabric type', () => {
    expect(SIGNAL_MATERIAL_TYPE).toBe('SignalFlow');
  });

  it('sets u_utilisation from options', () => {
    createSignalMaterial({ utilisation: 0.8 });
    const uniforms = capturedFabric?.uniforms as Record<string, unknown>;
    expect(uniforms.u_utilisation).toBe(0.8);
  });

  it('defaults u_utilisation to 0.3 when no options supplied', () => {
    createSignalMaterial();
    const uniforms = capturedFabric?.uniforms as Record<string, unknown>;
    expect(uniforms.u_utilisation).toBe(0.3);
  });

  it('initialises u_time to 0.0', () => {
    createSignalMaterial();
    const uniforms = capturedFabric?.uniforms as Record<string, unknown>;
    expect(uniforms.u_time).toBe(0.0);
  });

  it('initialises u_alert to 0.0', () => {
    createSignalMaterial();
    const uniforms = capturedFabric?.uniforms as Record<string, unknown>;
    expect(uniforms.u_alert).toBe(0.0);
  });

  it('returns an object with uniforms.u_time, u_utilisation, u_alert', () => {
    const mat = createSignalMaterial();
    expect(mat.uniforms).toBeDefined();
    expect(mat.uniforms.u_time).toBeDefined();
    expect(mat.uniforms.u_utilisation).toBeDefined();
    expect(mat.uniforms.u_alert).toBeDefined();
  });
});

describe('updateSignalUniforms', () => {
  it('increments u_time by dt', () => {
    // Use a plain object that satisfies the Cesium.Material interface for
    // uniforms — no WebGL required.
    const mockMaterial = {
      uniforms: { u_time: 0.0, u_utilisation: 0.3, u_alert: 0.0 },
    } as unknown as import('cesium').Material;

    updateSignalUniforms(mockMaterial, 0.016);

    expect(mockMaterial.uniforms.u_time).toBeCloseTo(0.016);
  });

  it('accumulates u_time across multiple calls', () => {
    const mockMaterial = {
      uniforms: { u_time: 1.0, u_utilisation: 0.5, u_alert: 0.0 },
    } as unknown as import('cesium').Material;

    updateSignalUniforms(mockMaterial, 0.016);
    updateSignalUniforms(mockMaterial, 0.016);

    expect(mockMaterial.uniforms.u_time).toBeCloseTo(1.032);
  });

  it('does not touch u_utilisation or u_alert', () => {
    const mockMaterial = {
      uniforms: { u_time: 0.0, u_utilisation: 0.7, u_alert: 1.0 },
    } as unknown as import('cesium').Material;

    updateSignalUniforms(mockMaterial, 0.033);

    expect(mockMaterial.uniforms.u_utilisation).toBe(0.7);
    expect(mockMaterial.uniforms.u_alert).toBe(1.0);
  });
});
