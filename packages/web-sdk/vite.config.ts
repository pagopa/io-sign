import { defineConfig } from "vitest/config";

export default defineConfig({
  build: {
    lib: {
      entry: "src/io-sign.ts",
      formats: ["es"],
      fileName: "io-sign",
    },
    target: "es2015",
  },
  test: {
    environment: "happy-dom",
  },
});
