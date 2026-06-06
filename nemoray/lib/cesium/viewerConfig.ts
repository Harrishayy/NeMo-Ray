import * as Cesium from 'cesium';

export const LONDON_POSITION = Cesium.Cartesian3.fromDegrees(-0.1278, 51.5074, 300);

export const LONDON_HEADING = Cesium.Math.toRadians(-20);

/**
 * Default landing pitch — a shallow, slanted oblique so building facades read in
 * 3D (closer to the horizon than a steep top-down). Shared by the initial view,
 * the reset shot, and the "3D" tilt toggle.
 */
export const OBLIQUE_PITCH = Cesium.Math.toRadians(-24);

export const INITIAL_CAMERA = {
  destination: LONDON_POSITION,
  orientation: {
    heading: LONDON_HEADING,
    pitch: OBLIQUE_PITCH,
    roll: 0,
  },
};

/**
 * Far whole-Earth view the camera starts on, so the intro flight reads as a
 * dramatic zoom-in from the globe down to London (matching the original
 * transition). The photorealistic tileset is global, so this renders as a
 * textured Earth even with the night-scene globe/atmosphere disabled.
 */
export const GLOBE_CAMERA = {
  destination: Cesium.Cartesian3.fromDegrees(-0.1278, 51.5074, 20_000_000),
  orientation: {
    heading: 0,
    pitch: Cesium.Math.toRadians(-90),
    roll: 0,
  },
};

// Zoom band for the city scene. The minimum stops the camera clipping through
// buildings; the maximum keeps the user inside the photorealistic-3D range so
// they never pull back into the empty void (globe/atmosphere are off for the
// night look). A future orbital "space mode" would raise MAX_ZOOM_M.
export const MIN_ZOOM_M = 30;
export const MAX_ZOOM_M = 9000;

export const NIGHT_SCENE_SETTINGS = {
  ambientOcclusionEnabled: true,
  bloomEnabled: true,
  bloomGlowOnly: false,
  bloomBrightness: 0.3,
  bloomIntensity: 2.0,
  sunLight: false,
  moonLight: false,
  skyAtmosphere: false,
  backgroundColor: Cesium.Color.fromCssColorString('#030a18'),
};
