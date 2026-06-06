import * as Cesium from 'cesium';

export const LONDON_POSITION = Cesium.Cartesian3.fromDegrees(-0.1278, 51.5074, 2800);

export const LONDON_HEADING = Cesium.Math.toRadians(-20);

export const INITIAL_CAMERA = {
  destination: LONDON_POSITION,
  orientation: {
    heading: LONDON_HEADING,
    pitch: Cesium.Math.toRadians(-38),
    roll: 0,
  },
};

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
