// Mirror of BANDWIDTH_COLORS from the HTML preview. 0=green, .5=yellow, 1=red.
// Exported for both JS (particles/tower halo) and GLSL (string-injected into shader).
export const RAMP_GLSL = /* glsl */`
vec3 utilColor(float u) {
  vec3 green  = vec3(0.0, 1.0, 0.05);
  vec3 yellow = vec3(1.0, 1.0, 0.05);
  vec3 red    = vec3(1.0, 0.0, 0.05);
  return u < 0.5 ? mix(green, yellow, u * 2.0)
                 : mix(yellow, red, (u - 0.5) * 2.0);
}`;

/** Same colour ramp as RAMP_GLSL, in JS. Returns [r, g, b] each 0..1. */
export function utilColorJS(u: number): [number, number, number] {
  const green:  [number, number, number] = [0.0, 1.0, 0.05];
  const yellow: [number, number, number] = [1.0, 1.0, 0.05];
  const red:    [number, number, number] = [1.0, 0.0, 0.05];

  if (u < 0.5) {
    const t = u * 2.0;
    return [
      green[0] + (yellow[0] - green[0]) * t,
      green[1] + (yellow[1] - green[1]) * t,
      green[2] + (yellow[2] - green[2]) * t,
    ];
  } else {
    const t = (u - 0.5) * 2.0;
    return [
      yellow[0] + (red[0] - yellow[0]) * t,
      yellow[1] + (red[1] - yellow[1]) * t,
      yellow[2] + (red[2] - yellow[2]) * t,
    ];
  }
}
