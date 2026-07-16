import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const thumbnailConsumers = [
  ["../app/page.tsx", "home portfolio and insight cards"],
  ["../app/portfolio/PortfolioListClient.tsx", "portfolio featured and grid cards"],
  ["../app/blog/BlogListClient.tsx", "blog featured, top, and list cards"],
  ["../app/blog/[slug]/page.tsx", "blog related post cards"],
  ["../app/portfolio/[slug]/page.tsx", "portfolio detail banner"],
  ["./ServicePortfolioSection.tsx", "service page portfolio cards"],
];

const managedThumbnailUrlPattern =
  /\b(?:thumbnailUrl|bannerUrl|featuredImageUrl)\b/u;

function managedThumbnailBlocks(source) {
  return [...source.matchAll(/<ManagedThumbnail[\s\S]*?\/>/gu)].map(
    (match) => match[0],
  );
}

function assertManagedThumbnailUrls(source, label) {
  assert.match(
    source,
    /ManagedThumbnail/u,
    `${label} must render managed thumbnails through ManagedThumbnail`,
  );

  const blocks = managedThumbnailBlocks(source);
  const urlExpressions = [
    ...source.matchAll(/\burl=\{([^}]+)\}/gu),
  ].map((match) => match[1]?.trim() ?? "");

  for (const urlExpression of urlExpressions) {
    if (!managedThumbnailUrlPattern.test(urlExpression)) {
      continue;
    }

    assert.ok(
      blocks.some((block) => block.includes(`url={${urlExpression}}`)),
      `${label} must route ${urlExpression} through ManagedThumbnail`,
    );
  }
}

test("managed thumbnail URLs render through ManagedThumbnail, including card slots", async () => {
  for (const [relativePath, label] of thumbnailConsumers) {
    const source = await readFile(new URL(relativePath, import.meta.url), "utf8");
    assertManagedThumbnailUrls(source, label);
  }
});
