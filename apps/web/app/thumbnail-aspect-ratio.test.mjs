import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

function rule(styles, selector) {
  const match = styles.match(
    new RegExp(`\\.${selector}\\s*\\{([\\s\\S]*?)\\n\\}`),
  );
  assert.ok(match, `${selector} rule must exist`);
  return match[1];
}

function assertThreeByTwo(styles, selector) {
  const css = rule(styles, selector);
  const selectorRules = styles.match(
    new RegExp(`\\.${selector}\\s*\\{[^}]*\\}`, "g"),
  );
  assert.match(css, /aspect-ratio:\s*3\s*\/\s*2;/);
  assert.ok(selectorRules, `${selector} rules must exist`);
  for (const selectorRule of selectorRules) {
    assert.doesNotMatch(selectorRule, /(?:^|\n)\s*height:/);
    assert.doesNotMatch(selectorRule, /aspect-ratio:\s*auto;/);
  }
}

test("home and service managed thumbnails use 1080 by 720 frames", async () => {
  const [home, service] = await Promise.all([
    readFile(new URL("./page.module.css", import.meta.url), "utf8"),
    readFile(
      new URL(
        "../components/ServicePortfolioSection.module.css",
        import.meta.url,
      ),
      "utf8",
    ),
  ]);

  assertThreeByTwo(home, "portfolioThumbnail");
  assertThreeByTwo(home, "insightThumbnail");
  assertThreeByTwo(service, "thumbnail");
});

test("blog managed thumbnails use 1080 by 720 frames", async () => {
  const [blog, detail] = await Promise.all([
    readFile(new URL("./blog/blog.module.css", import.meta.url), "utf8"),
    readFile(
      new URL("./blog/[slug]/blog-detail.module.css", import.meta.url),
      "utf8",
    ),
  ]);

  assertThreeByTwo(blog, "featuredCard");
  assertThreeByTwo(blog, "featuredThumbnail");
  assertThreeByTwo(blog, "topThumbnail");
  assertThreeByTwo(blog, "listThumbnail");
  assertThreeByTwo(detail, "relatedThumbnail");
});

test("portfolio index thumbnails use 1080 by 720 frames at every breakpoint", async () => {
  const styles = await readFile(
    new URL("./portfolio/page.module.css", import.meta.url),
    "utf8",
  );

  assertThreeByTwo(styles, "thumbnail");
  assertThreeByTwo(styles, "cardThumbnail");
});
