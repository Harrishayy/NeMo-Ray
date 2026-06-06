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

  // Bloom and AO disabled: both stages trigger GL_GUILTY_CONTEXT_RESET_KHR on
  // NVIDIA Linux drivers (460–570 series), crashing the Brave/Chrome GPU process.

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

  // globe is undefined when Viewer was created with globe:false — guard accordingly
  if (scene.globe) {
    scene.globe.show = false;
  }

  // Fog
  scene.fog.enabled = true;
  scene.fog.density = 0.00002;
  scene.fog.minimumBrightness = 0.03;
}
