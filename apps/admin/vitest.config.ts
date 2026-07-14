import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "src/components/content/**/*.test.ts",
      "src/components/content/**/*.test.tsx",
      "src/lib/contentAssetStorage.test.ts",
      "src/lib/thumbnailStorage.test.ts",
    ],
  },
});
