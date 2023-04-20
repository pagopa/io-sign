import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/io-sign.ts",
      formats: ["es"],
    },
    rollupOptions: {
      external: /^lit/,
    },
  },
});
