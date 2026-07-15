import { defineConfig } from "tsup";
import { readFileSync } from "fs";

const packageJson = JSON.parse(readFileSync("./package.json", "utf-8"));

export default defineConfig({
  entry: ["./src/app/main.ts"],
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: false,
  target: "node20",
  define: {
    APP_VERSION: JSON.stringify(packageJson.version)
  }
});
