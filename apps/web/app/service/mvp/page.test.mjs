import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readOrEmpty(url) {
  try {
    return await readFile(url, "utf8");
  } catch {
    return "";
  }
}

const pagePath = new URL("./page.tsx", import.meta.url);
const pageStylesPath = new URL("./page.module.css", import.meta.url);
const contentPath = new URL("./content.ts", import.meta.url);

test("MVP intro cards keep the approved 296px description width", async () => {
  const [page, pageStyles] = await Promise.all([
    readOrEmpty(pagePath),
    readOrEmpty(pageStylesPath),
  ]);

  assert.match(page, /mvpStyles\.introCardDescription/);
  assert.match(pageStyles, /\.introCardDescription\s*\{\s*max-width:\s*296px;/);
});

test("MVP page content is managed in the route content module", async () => {
  const [page, content] = await Promise.all([
    readOrEmpty(pagePath),
    readOrEmpty(contentPath),
  ]);

  assert.match(page, /from "\.\/content";/);

  for (const name of [
    "mvpIntroCards",
    "fundingPrograms",
    "supportSteps",
    "supportStepText",
    "mvpIncludedCards",
    "mvpFaqs",
  ]) {
    assert.match(content, new RegExp(`export const ${name}`));
    assert.doesNotMatch(page, new RegExp(`const ${name}`));
  }
});
