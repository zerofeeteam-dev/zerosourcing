import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const notFoundPagePath = new URL("./not-found.tsx", import.meta.url);

test("the 404 page offers clear recovery paths", async () => {
  const source = await readFile(notFoundPagePath, "utf8");

  assert.match(source, /<Header \/>/);
  assert.match(source, /<Footer \/>/);
  assert.match(source, /<h1[^>]*id="not-found-title"/);
  assert.match(source, /href="\/"/);
  assert.match(source, /href="\/portfolio"/);
  assert.match(source, /홈으로 돌아가기/);
  assert.match(source, /포트폴리오 둘러보기/);
  assert.match(source, /src="\/figma-assets\/404-lost-page\.svg"/);
  assert.doesNotMatch(source, /<Icon\b/);
  assert.doesNotMatch(source, /PAGE NOT FOUND/);
});
