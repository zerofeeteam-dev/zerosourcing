import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pagePath = new URL("./[slug]/page.tsx", import.meta.url);
const stylesPath = new URL(
  "./[slug]/portfolio-detail.module.css",
  import.meta.url,
);

test("portfolio detail renders the managed banner in the Figma frame", async () => {
  const [page, styles] = await Promise.all([
    readFile(pagePath, "utf8"),
    readFile(stylesPath, "utf8"),
  ]);

  assert.match(page, /import \{ ManagedThumbnail \} from/);
  assert.match(page, /className=\{styles\.bannerFrame!?\}/);
  assert.match(page, /url=\{portfolio\.bannerUrl\}/);
  assert.match(page, /alt=\{portfolio\.bannerAlt\}/);
  assert.match(
    styles,
    /\.bannerFrame\s*\{[\s\S]*?aspect-ratio:\s*9\s*\/\s*4;[\s\S]*?border-radius:\s*16px;[\s\S]*?background:\s*var\(--color-gray-100\);/,
  );
});
