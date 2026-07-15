import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const blogStylesPath = new URL(
  "./blog/[slug]/blog-detail.module.css",
  import.meta.url,
);
const portfolioStylesPath = new URL(
  "./portfolio/[slug]/portfolio-detail.module.css",
  import.meta.url,
);
const rawHtmlFramePath = new URL(
  "../../../packages/content/src/RawHtmlFrame.tsx",
  import.meta.url,
);
const rawHtmlSourcePath = new URL(
  "../../../packages/content/src/raw-html-source.ts",
  import.meta.url,
);

function rule(styles, selector) {
  const match = styles.match(
    new RegExp(`\\.${selector}\\s*\\{([\\s\\S]*?)\\n\\}`),
  );
  assert.ok(match, `${selector} rule must exist`);
  return match[1];
}

test("raw HTML details use the sandboxed, measured iframe bridge", async () => {
  const [frame, source] = await Promise.all([
    readFile(rawHtmlFramePath, "utf8"),
    readFile(rawHtmlSourcePath, "utf8"),
  ]);

  assert.match(frame, /sandbox="allow-scripts"/);
  assert.match(frame, /scrolling="no"/);
  assert.match(frame, /RAW_HTML_MEASURE_REQUEST_TYPE/);
  assert.match(frame, /onLoad=\{requestHeight\}/);
  assert.match(frame, /window\.addEventListener\("message", onMessage\)/);
  assert.match(frame, /style=\{\{ height \}\}/);
  assert.doesNotMatch(frame, /MAX_HEIGHT/);
  assert.match(source, /parent\.postMessage/);
});

test("detail content containers have no fixed-height placeholder", async () => {
  const [blogStyles, portfolioStyles] = await Promise.all([
    readFile(blogStylesPath, "utf8"),
    readFile(portfolioStylesPath, "utf8"),
  ]);

  for (const [styles, selector] of [
    [blogStyles, "articleBody"],
    [portfolioStyles, "managedContent"],
  ]) {
    const contentRule = rule(styles, selector);

    assert.match(contentRule, /width:\s*100%;/);
    assert.doesNotMatch(contentRule, /min-height|(?:^|\n)\s*height:/);
  }

  assert.doesNotMatch(portfolioStyles, /\.htmlPreview/);
  assert.doesNotMatch(portfolioStyles, /min-height:\s*(?:1200|720)px/);
  assert.doesNotMatch(blogStyles, /min-height:\s*1200px/);
});
