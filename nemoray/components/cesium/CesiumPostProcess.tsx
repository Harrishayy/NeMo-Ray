'use client';

import * as Cesium from 'cesium';
import { useEffect } from 'react';
import { useCesiumViewer } from './CesiumContext';

// ─── Vignette ────────────────────────────────────────────────────────────────
const VIGNETTE_GLSL = `
uniform sampler2D colorTexture;
in vec2 v_textureCoordinates;
void main() {
    vec4 color = texture(colorTexture, v_textureCoordinates);
    vec2 uv    = v_textureCoordinates - 0.5;
    float vig  = smoothstep(0.85, 0.30, length(uv) * 1.5);
    out_FragColor = vec4(color.rgb * mix(0.72, 1.0, vig), color.a);
}
`;

// ─── Specular Flare ───────────────────────────────────────────────────────────
// Triggers only on near-mirror-bright pixels (threshold 0.94) — genuine specular
// returns from glass curtain walls and water surface. Combines:
//   • Anamorphic horizontal streak: SPREAD 0.025 (was 0.26), no texture smear at zoom
//   • Tight radial halo: 8-tap circle at 0.004 UV radius, warm tint
// At threshold 0.94 the effect stays invisible on lit building textures and only
// fires when a window or ripple reflects the sun toward the camera.
const SPECULAR_FLARE_GLSL = `
uniform sampler2D colorTexture;
in vec2 v_textureCoordinates;

const float THRESHOLD     = 0.96;
const float STREAK_SPREAD = 0.018;
const float HALO_RADIUS   = 0.003;

vec3 specularExtract(vec2 uv) {
    vec3  s   = texture(colorTexture, clamp(uv, 0.0, 1.0)).rgb;
    float lum = dot(s, vec3(0.299, 0.587, 0.114));
    return s * max(0.0, lum - THRESHOLD) / (1.0 - THRESHOLD);
}

void main() {
    vec4 color = texture(colorTexture, v_textureCoordinates);

    // Anamorphic streak — horizontal only, chromatic R/B split
    vec3  streak  = vec3(0.0);
    float streakW = 0.0;
    for (int i = 1; i <= 6; i++) {
        float t = float(i) / 6.0;
        float w = pow(1.0 - t, 2.0);
        float d = STREAK_SPREAD * t;
        vec3 sR = specularExtract(v_textureCoordinates + vec2(d * 1.05, 0.0));
        vec3 sL = specularExtract(v_textureCoordinates - vec2(d * 0.95, 0.0));
        streak  += (sR + sL) * w;
        streakW += w * 2.0;
    }
    streak = (streak / max(streakW, 0.001)) * vec3(0.55, 0.78, 1.40);

    // Radial halo — 8-tap circle
    vec3 halo = vec3(0.0);
    for (int i = 0; i < 8; i++) {
        float angle = float(i) * 0.7854; // PI/4 steps
        vec2  off   = vec2(cos(angle), sin(angle)) * HALO_RADIUS;
        halo += specularExtract(v_textureCoordinates + off);
    }
    halo = (halo / 8.0) * vec3(1.15, 1.05, 0.85);

    out_FragColor = vec4(color.rgb + streak * 0.20 + halo * 0.30, color.a);
}
`;

// ─── Lens Ghosts ─────────────────────────────────────────────────────────────
// Radial reflections along the lens axis from specular-only sources.
// Threshold raised to 0.93 and GHOST_MIX halved vs the old shader so ghosts
// only appear from genuine high-intensity reflections (Shard glass, Thames glints).
const LENS_GHOST_GLSL = `
uniform sampler2D colorTexture;
in vec2 v_textureCoordinates;

const float THRESHOLD = 0.96;
const float GHOST_MIX = 0.04;

vec3 specularSample(vec2 uv) {
    vec3  s   = texture(colorTexture, clamp(uv, 0.0, 1.0)).rgb;
    float lum = dot(s, vec3(0.299, 0.587, 0.114));
    return s * max(0.0, lum - THRESHOLD) / (1.0 - THRESHOLD);
}

void main() {
    vec4 color   = texture(colorTexture, v_textureCoordinates);
    vec2 centred = v_textureCoordinates - 0.5;

    vec3 ghosts = vec3(0.0);
    ghosts += specularSample(0.5 - centred * 1.20) * vec3(0.80, 0.70, 1.30) * 0.40;
    ghosts += specularSample(0.5 - centred * 1.80) * vec3(0.60, 1.00, 1.20) * 0.25;
    ghosts += specularSample(0.5 - centred * 2.60) * vec3(1.20, 0.70, 0.60) * 0.15;

    out_FragColor = vec4(color.rgb + ghosts * GHOST_MIX, color.a);
}
`;

export default function CesiumPostProcess() {
  const viewer = useCesiumViewer();

  useEffect(() => {
    if (!viewer) return;

    const stages = viewer.scene.postProcessStages;
    const vignette = stages.add(new Cesium.PostProcessStage({ fragmentShader: VIGNETTE_GLSL }));
    const flare    = stages.add(new Cesium.PostProcessStage({ fragmentShader: SPECULAR_FLARE_GLSL }));
    const ghost    = stages.add(new Cesium.PostProcessStage({ fragmentShader: LENS_GHOST_GLSL }));

    return () => {
      if (!viewer.isDestroyed()) {
        stages.remove(vignette);
        stages.remove(flare);
        stages.remove(ghost);
      }
    };
  }, [viewer]);

  return null;
}
