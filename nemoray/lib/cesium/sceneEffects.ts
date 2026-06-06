import * as Cesium from 'cesium';

export function applyNightScene(viewer: Cesium.Viewer): void {
  const scene = viewer.scene;

  // Deep navy background
  scene.backgroundColor = Cesium.Color.fromCssColorString('#030a18');

  // Dim directional light
  scene.light = new Cesium.DirectionalLight({
    direction: new Cesium.Cartesian3(0.354, 0.354, 0.866),
    intensity: 0.1,
  });

  // Bloom post-process
  if (scene.postProcessStages.bloom !== undefined) {
    scene.postProcessStages.bloom.enabled = true;
    const bloomUniforms = scene.postProcessStages.bloom.uniforms;
    if (bloomUniforms) {
      bloomUniforms.glowOnly = false;
      bloomUniforms.delta = 1.0;
      bloomUniforms.sigma = 2.78;
      bloomUniforms.stepSize = 1.0;
    }
  }

  // Ambient occlusion
  if (scene.postProcessStages.ambientOcclusion !== undefined) {
    scene.postProcessStages.ambientOcclusion.enabled = true;
  }

  // Hide sun and moon
  if (scene.sun !== undefined) {
    scene.sun.show = false;
  }
  if (scene.moon !== undefined) {
    scene.moon.show = false;
  }

  // Hide sky atmosphere
  if (scene.skyAtmosphere !== undefined) {
    scene.skyAtmosphere.show = false;
  }

  // Hide sky box
  if (scene.skyBox !== undefined) {
    scene.skyBox.show = false;
  }

  // Use Photorealistic 3D Tiles — no globe needed
  scene.globe.show = false;

  // Fog
  scene.fog.enabled = true;
  scene.fog.density = 0.00002;
  scene.fog.minimumBrightness = 0.03;
}
