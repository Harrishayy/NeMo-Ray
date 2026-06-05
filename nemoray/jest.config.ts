import type { Config } from 'jest';
const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: { '^react-map-gl/maplibre$': '<rootDir>/__mocks__/react-map-gl.ts' },
};
export default config;
