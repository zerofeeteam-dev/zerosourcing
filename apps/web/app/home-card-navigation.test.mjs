import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const contentPath = new URL("./content.ts", import.meta.url);
const pagePath = new URL("./page.tsx", import.meta.url);

test("home portfolio and process cards link to registered detail pages", async () => {
  const [content, page] = await Promise.all([
    readFile(contentPath, "utf8"),
    readFile(pagePath, "utf8"),
  ]);
  const portfolioSource = content
    .split("export const homePortfolios =")[1]
    .split("export const homeInsights =")[0];
  const insightSource = content
    .split("export const homeInsights =")[1]
    .split("export const homeFaqs =")[0];

  assert.match(page, /import Link from "next\/link";/);
  assert.match(page, /href=\{`\/portfolio\/\$\{portfolio\.slug\}`\}/);
  assert.match(page, /href=\{`\/blog\/\$\{insight\.slug\}`\}/);
  assert.equal(portfolioSource.match(/slug: /g)?.length, 6);
  assert.equal(insightSource.match(/slug: /g)?.length, 3);
  assert.doesNotMatch(
    page,
    /<article className=\{styles\.(?:portfolioCard|insightCard)\}/,
  );
});
