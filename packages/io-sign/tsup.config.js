import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["./src/**/**.ts", "!./src/**/**.spec.ts"],
  splitting: false,
  sourcemap: true,
  dts: true,
  clean: true,
  minify: false,
  target: "node16",
});
