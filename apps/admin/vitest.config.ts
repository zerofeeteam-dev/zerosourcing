import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    include: [
      "src/components/admin/AdminForm.test.tsx",
      "src/components/content/**/*.test.ts",
      "src/components/content/**/*.test.tsx",
      "src/lib/contentAssetStorage.test.ts",
      "src/lib/router.test.ts",
      "src/lib/thumbnailPersistence.test.ts",
      "src/lib/thumbnailStorage.test.ts",
      "src/navigation/**/*.test.tsx",
      "src/pages/**/*.test.tsx",
      "src/pages/content/**/*.test.ts",
    ],
  },
});
