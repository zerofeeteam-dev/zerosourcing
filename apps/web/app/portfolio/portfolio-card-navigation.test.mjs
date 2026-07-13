import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pagePath = new URL("./page.tsx", import.meta.url);
const itemsPath = new URL("./portfolio-items.ts", import.meta.url);

test("every portfolio card links to its registered detail slug", async () => {
  const [items, page] = await Promise.all([
    readFile(itemsPath, "utf8"),
    readFile(pagePath, "utf8"),
  ]);
  const portfolioItemsSource = items.split(
    "export const portfolioDetails =",
  )[0];
  const portfolioDetailsSource = items.split(
    "export const portfolioDetails =",
  )[1];

  assert.match(page, /import Link from "next\/link";/);
  assert.match(
    page,
    /className=\{`\$\{styles\.featured\} \$\{styles\.clickableCard\}`\}/,
  );
  assert.match(page, /href=\{`\/portfolio\/\$\{featuredCase\.slug\}`\}/);
  assert.match(
    page,
    /<Link[\s\S]*?href=\{`\/portfolio\/\$\{item\.slug\}`\}[\s\S]*?>/,
  );
  assert.doesNotMatch(page, /useRouter|router\.push|role="link"|tabIndex/);
  assert.equal(portfolioItemsSource.match(/slug: /g)?.length, 9);
  assert.equal(portfolioDetailsSource.match(/slug: /g)?.length, 9);
});
