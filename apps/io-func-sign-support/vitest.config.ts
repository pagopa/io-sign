import { defineConfig } from "vitest/config";

export default defineConfig({
  define: {
    APP_VERSION: JSON.stringify("test")
  }
});
