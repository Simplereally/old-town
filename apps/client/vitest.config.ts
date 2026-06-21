import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const sharedIndex = fileURLToPath(new URL("../../packages/shared/src/index.ts", import.meta.url));
const sharedSrc = fileURLToPath(new URL("../../packages/shared/src", import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@old-town\/shared$/, replacement: sharedIndex },
      { find: /^@old-town\/shared\/(.*)$/, replacement: `${sharedSrc}/$1` },
    ],
  },
  test: {
    globals: false,
    environment: "jsdom",
    include: ["src/**/*.{test,spec}.ts"],
  },
});
