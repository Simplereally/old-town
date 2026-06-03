import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  root: resolve(__dirname),
  build: {
    outDir: resolve(__dirname, "dist"),
    sourcemap: true,
  },
  server: {
    port: 5174,
    host: true,
  },
  envPrefix: "VITE_",
  resolve: {
    alias: {
      "@old-town/shared": resolve(__dirname, "../../packages/shared/src/index.ts"),
    },
  },
});
