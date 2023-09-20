import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["./src/infra/web.ts"],
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: false,
  target: "node18",
});
