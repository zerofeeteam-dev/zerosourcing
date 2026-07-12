import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const detailStylePaths = [
  new URL("./blog/[slug]/blog-detail.module.css", import.meta.url),
  new URL("./portfolio/[slug]/portfolio-detail.module.css", import.meta.url),
];

test("detail titles use the bold-24 size at 640px and below", async () => {
  for (const stylePath of detailStylePaths) {
    const styles = await readFile(stylePath, "utf8");

    assert.match(
      styles,
      /@media \(max-width: 640px\)\s*{[\s\S]*?\.title\s*{[\s\S]*?font-size:\s*24px;[\s\S]*?line-height:\s*32px;/,
    );
  }
});
