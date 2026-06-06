import * as Cesium from 'cesium';

export type ProposalEvent = {
  type: 'accepted' | 'rejected' | 'overview';
  proposal?: { lat: number; lng: number; accepted: boolean };
};

export class CesiumCameraController {
  private viewer: Cesium.Viewer;

  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer;
  }

  flyToLondon(): void {
    this.viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(-0.1278, 51.5074, 2800),
      orientation: {
        heading: Cesium.Math.toRadians(-20),
        pitch: Cesium.Math.toRadians(-38),
        roll: 0,
      },
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
