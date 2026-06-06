import nextConfig from "../next.config";

/**
 * Guard for a LOCKED invariant (docs/INVARIANTS.md #1).
 *
 * CesiumJS creates a WebGL context the browser can't release fast enough for React
 * Strict Mode's mount→unmount→remount cycle, so enabling Strict Mode makes the map fail
 * to initialise. This test fails loudly if someone flips `reactStrictMode` back on — so
 * the regression is caught in CI rather than as a blank map in the demo.
 */
describe("next.config", () => {
  test("reactStrictMode stays false (Cesium WebGL context can't survive StrictMode double-mount)", () => {
    expect(nextConfig.reactStrictMode).toBe(false);
  });
});
