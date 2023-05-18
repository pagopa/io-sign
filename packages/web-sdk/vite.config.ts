import { defineConfig } from "vitest/config";

import minifyHTML from "rollup-plugin-minify-html-literals";

export default defineConfig({
  build: {
    lib: {
      entry: "src/io-sign.ts",
      formats: ["es"],
      fileName: "io-sign",
    },
    target: "es2015",
    minify: true,
    rollupOptions: {
      plugins: [minifyHTML.default()],
    },
  },
  test: {
    environment: "happy-dom",
  },
  server: {
    host: "0.0.0.0",
  },
});
