import * as Cesium from 'cesium';

export function applyNightScene(viewer: Cesium.Viewer): void {
  const scene = viewer.scene;

  scene.backgroundColor = Cesium.Color.fromCssColorString('#030a18');

  scene.light = new Cesium.DirectionalLight({
    direction: new Cesium.Cartesian3(0.354, 0.354, 0.866),
    intensity: 0.1,
  });

  // Bloom re-enabled with conservative settings. Lower sigma (1.5 vs 2.78) reduces
  // shader complexity that was triggering GL_GUILTY_CONTEXT_RESET_KHR on NVIDIA Linux.
  // SSAO remains disabled — it was the heavier culprit.
  if (scene.postProcessStages.bloom !== undefined) {
    scene.postProcessStages.bloom.enabled = true;
    const u = scene.postProcessStages.bloom.uniforms;
    if (u) {
      u.glowOnly = false;
      u.delta = 1.0;
      u.sigma = 0.6;
      u.stepSize = 0.4;
    }
  }

  if (scene.sun) scene.sun.show = false;
  if (scene.moon) scene.moon.show = false;
  if (scene.skyAtmosphere) scene.skyAtmosphere.show = false;
  if (scene.skyBox) scene.skyBox.show = false;
  if (scene.globe) scene.globe.show = false;

  scene.fog.enabled = true;
  scene.fog.density = 0.00002;
  scene.fog.minimumBrightness = 0.03;
}
