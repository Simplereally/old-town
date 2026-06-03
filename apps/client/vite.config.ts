import { resolve } from "node:path";
import { defineConfig } from "vite";
import { PROTOCOL_VERSION } from "../../packages/shared/src/protocol/packets";

export default defineConfig({
  root: resolve(__dirname),
  plugins: [
    {
      name: "old-town-build-manifest",
      generateBundle() {
        this.emitFile({
          type: "asset",
          fileName: "old-town-build.json",
          source: `${JSON.stringify({ protocolVersion: PROTOCOL_VERSION }, null, 2)}\n`,
        });
      },
    },
  ],
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
