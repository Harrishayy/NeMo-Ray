import * as Cesium from 'cesium';
import { RAMP_GLSL } from '../contract/colorRamp';

/** Fabric type string — constant so Cesium compiles the shader once. */
export const SIGNAL_MATERIAL_TYPE = 'SignalFlow' as const;

/**
 * Creates a Cesium Fabric material for signal path rendering.
 * The shader produces utilisation-driven green→yellow→red glow
 * with a travelling pulse band and optional alert mode.
 *
 * The Fabric `type` string is constant ('SignalFlow') so the shader
 * is compiled once by Cesium and reused across all material instances.
 */
export function createSignalMaterial(opts?: { utilisation?: number }): Cesium.Material {
  return new Cesium.Material({
    fabric: {
      type: SIGNAL_MATERIAL_TYPE,
      uniforms: {
        u_time: 0.0,
        u_utilisation: opts?.utilisation ?? 0.3,
        u_alert: 0.0,
      },
      source: /* glsl */`
        ${RAMP_GLSL}
        czm_material czm_getMaterial(czm_materialInput materialInput) {
          czm_material m = czm_getDefaultMaterial(materialInput);
          float s = materialInput.st.s;            // along the line 0..1
          float across = abs(materialInput.st.t - 0.5) * 2.0;  // 0 centre → 1 edge
          vec3 base = mix(utilColor(u_utilisation), vec3(1.0, 0.3, 0.0), u_alert);
          float pulse = 0.5 + 0.5 * sin(s * 18.0 - u_time * 3.0);   // travelling band
          float glow  = smoothstep(1.0, 0.0, across);                // width falloff
          m.diffuse  = base;
          m.emission = base * (0.4 + 0.6 * pulse) * glow;
          m.alpha    = glow * (0.5 + 0.5 * pulse) * (0.6 + 0.4 * u_alert);
          return m;
        }`,
    },
  });
}

/**
 * Advance u_time on the material. Call from scene.preUpdate.
 * Does NOT allocate — only updates the uniform float.
 */
export function updateSignalUniforms(m: Cesium.Material, dt: number): void {
  m.uniforms.u_time += dt;
}
