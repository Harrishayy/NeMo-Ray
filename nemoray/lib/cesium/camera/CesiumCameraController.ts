import * as Cesium from 'cesium';
import { INITIAL_CAMERA, MAX_ZOOM_M, MIN_ZOOM_M, OBLIQUE_PITCH } from '@/lib/cesium/viewerConfig';

export type ProposalEvent = {
  type: 'accepted' | 'rejected' | 'overview';
  proposal?: { lat: number; lng: number; accepted: boolean };
};

/** Fraction of the camera→focus distance covered by one stepped zoom click. */
const ZOOM_STEP = 0.4;
const ZOOM_DURATION_S = 0.35;

export class CesiumCameraController {
  private viewer: Cesium.Viewer;

  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer;
  }

  /**
   * Bound the zoom band so the wheel and the on-map buttons can't clip through
   * buildings or fly back into the empty void. Called once when the viewer is
   * ready. Limits live in viewerConfig so a future space mode can raise them.
   */
  configureControls(): void {
    const ssc = this.viewer.scene.screenSpaceCameraController;
    ssc.minimumZoomDistance = MIN_ZOOM_M;
    ssc.maximumZoomDistance = MAX_ZOOM_M;
  }

  /**
   * Stepped, animated, altitude-aware zoom. Moves the camera ~40% along the ray
   * to whatever is under screen-centre, clamped to the zoom band, so each click
   * feels consistent at any height. Falls back to a height-scaled dolly when the
   * centre pick misses (e.g. aimed at empty sky).
   */
  zoomByFactor(direction: 'in' | 'out'): void {
    const { scene, camera } = this.viewer;
    const sign = direction === 'in' ? 1 : -1;

    const centre = new Cesium.Cartesian2(
      scene.canvas.clientWidth / 2,
      scene.canvas.clientHeight / 2,
    );
    const focus = scene.pickPosition(centre);

    if (!Cesium.defined(focus)) {
      // No surface under the cursor — dolly by a fraction of current height.
      const height = camera.positionCartographic.height;
      const amount = height * ZOOM_STEP;
      if (direction === 'in') camera.zoomIn(amount);
      else camera.zoomOut(amount);
      return;
    }

    const toFocus = Cesium.Cartesian3.subtract(focus, camera.position, new Cesium.Cartesian3());
    const distance = Cesium.Cartesian3.magnitude(toFocus);

    // Distance remaining to the focus point after this step, clamped to the band.
    const stepped = distance * (1 - sign * ZOOM_STEP);
    const targetDistance = Cesium.Math.clamp(stepped, MIN_ZOOM_M, MAX_ZOOM_M);

    const dir = Cesium.Cartesian3.normalize(toFocus, new Cesium.Cartesian3());
    const offset = Cesium.Cartesian3.multiplyByScalar(dir, targetDistance, new Cesium.Cartesian3());
    const destination = Cesium.Cartesian3.subtract(focus, offset, new Cesium.Cartesian3());

    camera.flyTo({
      destination,
      orientation: { heading: camera.heading, pitch: camera.pitch, roll: camera.roll },
      duration: ZOOM_DURATION_S,
      easingFunction: Cesium.EasingFunction.CUBIC_OUT,
    });
  }

  /** Snap between a top-down (2D) and an oblique (3D) view over the same point. */
  setTilt(mode: '2d' | '3d'): void {
    const { camera } = this.viewer;
    const carto = camera.positionCartographic;
    camera.flyTo({
      destination: Cesium.Cartesian3.fromRadians(carto.longitude, carto.latitude, carto.height),
      orientation: {
        heading: camera.heading,
        pitch: mode === '2d' ? Cesium.Math.toRadians(-90) : OBLIQUE_PITCH,
        roll: 0,
      },
      duration: 0.8,
      easingFunction: Cesium.EasingFunction.CUBIC_IN_OUT,
    });
  }

  /** Return to the default London oblique establishing shot. */
  resetView(): void {
    this.flyToLondon();
  }

  /**
   * Cinematic intro: a single animated flight from the far globe view (set
   * instantly on init) down to the slanted London cityscape. `onSettled` fires
   * whether the flight completes or the user interrupts it — wire zoom limits
   * there so they don't clamp the far starting view mid-flight.
   */
  flyInFromGlobe(onSettled?: () => void): void {
    this.viewer.camera.flyTo({
      ...INITIAL_CAMERA,
      duration: 4.0,
      easingFunction: Cesium.EasingFunction.CUBIC_IN_OUT,
      complete: onSettled,
      cancel: onSettled,
    });
  }

  flyToLondon(): void {
    this.viewer.camera.flyTo({
      ...INITIAL_CAMERA,
      duration: 2.5,
      easingFunction: Cesium.EasingFunction.CUBIC_IN_OUT,
    });
  }

  flyToSite(site: { lat: number; lng: number }, mode: 'inspect' | 'overview'): void {
    if (mode === 'inspect') {
      this.viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(site.lng, site.lat, 400),
        orientation: {
          heading: Cesium.Math.toRadians(-20 + (Math.random() - 0.5) * 60),
          pitch: Cesium.Math.toRadians(-55),
          roll: 0,
        },
        duration: 2.0,
      });
    } else {
      this.viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(site.lng, site.lat, 1800),
        orientation: {
          heading: Cesium.Math.toRadians(-20),
          pitch: Cesium.Math.toRadians(-30),
          roll: 0,
        },
        duration: 2.2,
      });
    }
  }

  flyToProposal(proposal: { lat: number; lng: number; accepted: boolean }): void {
    if (proposal.accepted) {
      this.flyToSite({ lat: proposal.lat, lng: proposal.lng }, 'inspect');
    } else {
      this.viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(proposal.lng, proposal.lat, 600),
        orientation: {
          heading: Cesium.Math.toRadians(40),
          pitch: Cesium.Math.toRadians(-45),
          roll: 0,
        },
        duration: 1.8,
      });
      const handler = this.viewer.camera.moveEnd.addEventListener(() => {
        this.viewer.camera.moveEnd.removeEventListener(handler);
        setTimeout(() => this.flyToSite({ lat: proposal.lat, lng: proposal.lng }, 'overview'), 1000);
      });
    }
  }

  startOrbit(lat: number, lng: number, altitudeM: number, periodS: number): () => void {
    const startTime = Date.now();
    const removeTickListener = this.viewer.clock.onTick.addEventListener(() => {
      const elapsedS = (Date.now() - startTime) / 1000;
      const heading = (2 * Math.PI * elapsedS) / periodS;
      this.viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(lng, lat, altitudeM),
        orientation: {
          heading,
          pitch: Cesium.Math.toRadians(-30),
          roll: 0,
        },
      });
    });

    return () => {
      removeTickListener();
    };
  }

  fitLondonBounds(): void {
    this.viewer.camera.flyTo({
      destination: Cesium.Rectangle.fromDegrees(-0.51, 51.28, 0.33, 51.69),
      duration: 1.8,
    });
  }
}
