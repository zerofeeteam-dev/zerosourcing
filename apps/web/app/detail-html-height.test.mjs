import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const blogStylesPath = new URL("./blog/[slug]/blog-detail.module.css", import.meta.url);
const portfolioStylesPath = new URL(
  "./portfolio/[slug]/portfolio-detail.module.css",
  import.meta.url,
);

function rule(styles, selector) {
  const match = styles.match(new RegExp(`\\.${selector}\\s*\\{([\\s\\S]*?)\\n\\}`));
  assert.ok(match, `${selector} rule must exist`);
  return match[1];
}

test("detail HTML containers grow beyond their baseline height", async () => {
  const [blogStyles, portfolioStyles] = await Promise.all([
    readFile(blogStylesPath, "utf8"),
    readFile(portfolioStylesPath, "utf8"),
  ]);

  for (const [styles, selector] of [
    [blogStyles, "articleBody"],
    [portfolioStyles, "htmlPreview"],
  ]) {
    const contentRule = rule(styles, selector);

    assert.match(contentRule, /min-height:\s*1200px;/);
    assert.doesNotMatch(contentRule, /(?:^|\n)\s*height:/);
  }

  assert.match(
    portfolioStyles,
    /@media \(max-width: 480px\)[\s\S]*?\.htmlPreview\s*\{[\s\S]*?min-height:\s*720px;/,
  );
});
