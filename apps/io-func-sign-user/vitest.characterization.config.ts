import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/characterization/**/*.test.ts"],
    globalSetup: ["tests/global-setup.ts"],
    testTimeout: 120_000,
    hookTimeout: 180_000
  }
});
