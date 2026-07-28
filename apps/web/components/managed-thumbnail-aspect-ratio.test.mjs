import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const managedThumbnailComponentPath = new URL(
  "./ManagedThumbnail.tsx",
  import.meta.url,
);
const managedThumbnailStylesPath = new URL(
  "./ManagedThumbnail.module.css",
  import.meta.url,
);
const thumbnailSlotStyles = [
  [
    new URL("../app/page.module.css", import.meta.url),
    ["portfolioThumbnail", "insightThumbnail"],
  ],
  [
    new URL("../app/blog/blog.module.css", import.meta.url),
    ["featuredThumbnail", "listThumbnail"],
  ],
  [
    new URL("../app/blog/[slug]/blog-detail.module.css", import.meta.url),
    ["relatedThumbnail"],
  ],
  [
    new URL("../app/portfolio/page.module.css", import.meta.url),
    ["thumbnail", "cardThumbnail"],
  ],
  [
    new URL(
      "../app/portfolio/[slug]/portfolio-detail.module.css",
      import.meta.url,
    ),
    ["bannerFrame"],
  ],
  [
    new URL("./ServicePortfolioSection.module.css", import.meta.url),
    ["thumbnail"],
  ],
];

function selectorBodies(styles, selector) {
  return [
    ...styles.matchAll(new RegExp(`\\.${selector}\\s*\\{([^}]*)\\}`, "gu")),
  ].map((match) => match[1]);
}

test("managed thumbnails use next/image optimization", async () => {
  const component = await readFile(managedThumbnailComponentPath, "utf8");

  assert.doesNotMatch(component, /\bunoptimized\b/u);
});

test("managed thumbnails preserve the stored 3:2 image ratio", async () => {
  const styles = await readFile(managedThumbnailStylesPath, "utf8");

  assert.match(styles, /\.frame\s*\{[\s\S]*?aspect-ratio:\s*3\s*\/\s*2;/);
});

test("public thumbnail slots do not override the shared ratio with fixed heights", async () => {
  for (const [path, selectors] of thumbnailSlotStyles) {
    const styles = await readFile(path, "utf8");

    for (const selector of selectors) {
      const bodies = selectorBodies(styles, selector);
      assert.ok(
        bodies.length > 0,
        `${selector} is missing from ${path.pathname}`,
      );
      for (const body of bodies) {
        assert.doesNotMatch(body, /\bheight\s*:/u);
      }
    }
  }
});
