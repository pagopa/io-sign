import { defineConfig } from "vitest/config";

export default defineConfig({
  build: {
    lib: {
      entry: "src/io-sign.ts",
      formats: ["es"],
      fileName: "sdk",
    },
  },
  test: {
    environment: "happy-dom",
  },
});
