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

  assert.match(page, /import Link from "next\/link";/);
  assert.match(page, /export const revalidate = 300;/);
  assert.match(page, /unstable_cache/);
  assert.match(page, /export default async function Home/);
  assert.match(page, /getPublishedPortfolios/);
  assert.match(page, /getPublishedBlogPosts/);
  assert.match(page, /selectHomePortfolios/);
  assert.match(page, /selectHomeBlogPosts/);
  assert.match(page, /<ManagedThumbnail/);
  assert.match(page, /href=\{`\/portfolio\/\$\{portfolio\.slug\}`\}/);
  assert.match(page, /href=\{`\/blog\/\$\{insight\.slug\}`\}/);
  assert.match(page, /등록된 포트폴리오가 없습니다\./);
  assert.match(page, /등록된 인사이트가 없습니다\./);
  assert.doesNotMatch(content, /export const homePortfolios/);
  assert.doesNotMatch(content, /export const homeInsights/);
  assert.doesNotMatch(
    page,
    /<article className=\{styles\.(?:portfolioCard|insightCard)\}/,
  );
});
