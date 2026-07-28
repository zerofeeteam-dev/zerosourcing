import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pagePath = new URL("./page.tsx", import.meta.url);
const contentPath = new URL("./content.ts", import.meta.url);

test("the privacy consent route exposes both contact consent notices", async () => {
  const [page, content] = await Promise.all([
    readFile(pagePath, "utf8"),
    readFile(contentPath, "utf8"),
  ]);

  assert.match(page, /<Header \/>/);
  assert.match(page, /<Footer \/>/);
  assert.match(page, /path: "\/privacy\/consent"/);
  assert.match(page, /id=\{notice\.id\}/);

  for (const requiredCopy of [
    "개인정보 수집·이용 동의",
    "개인정보 국외 이전 동의",
    "문의 접수일로부터 1년",
    "Vercel Inc.",
    "Slack Technologies, LLC",
    "동의 거부 권리 및 불이익",
  ]) {
    assert.ok(content.includes(requiredCopy), requiredCopy);
  }
});
