import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Allow intentionally-unused identifiers when prefixed with `_`.
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  // The CesiumJS / MapLibre map module is a separately-authored integration
  // (feat/web-map-rendering). It carries its own conventions — Cesium's global
  // `window.CESIUM_BASE_URL`, ref-in-render camera hooks — so its lint rules are
  // scoped down to warnings here rather than rewriting the collaborator's code.
  {
    files: [
      "components/cesium/**/*.{ts,tsx}",
      "hooks/use*Camera*.{ts,tsx}",
      "lib/camera/**/*.{ts,tsx}",
      "lib/cesium/**/*.{ts,tsx}",
      "lib/deck/**/*.{ts,tsx}",
      "lib/maplibre/**/*.{ts,tsx}",
      "lib/agent/**/*.{ts,tsx}",
      "lib/data/**/*.{ts,tsx}",
      "__tests__/**/*.{ts,tsx}",
      "stories/**/*.{ts,tsx}",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/refs": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Cesium vendor assets copied into public/ by the predev/prebuild script.
    "public/cesium/**",
  ]),
]);

export default eslintConfig;
