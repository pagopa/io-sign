import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["./src/infra/azure/functions/**.ts"],
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: false,
  noExternal: [/^@internal\//],
  target: "node16",
});
