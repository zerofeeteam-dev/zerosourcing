import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readOrEmpty(path) {
  try {
    return await readFile(new URL(path, import.meta.url), "utf8");
  } catch {
    return "";
  }
}

test("the privacy route renders the complete source policy with the shared chrome", async () => {
  const [page, content, styles, sharedStyles] = await Promise.all([
    readOrEmpty("./page.tsx"),
    readOrEmpty("./content.ts"),
    readOrEmpty("./page.module.css"),
    readOrEmpty("../term/page.module.css"),
  ]);

  assert.match(page, /<Header \/>/);
  assert.match(page, /<Footer \/>/);
  assert.match(page, /<h1[^>]*>개인정보처리방침<\/h1>/);
  assert.match(page, /privacyArticles\.map/);
  assert.match(page, /<section/);
  assert.match(page, /<h2/);
  assert.match(page, /"ol"/);
  assert.match(page, /"ul"/);

  assert.match(content, /제로피\(이하 ‘회사’\)/);
  assert.match(content, /제1조 \(수집하는 개인정보의 항목 및 수집 방법\)/);
  assert.match(content, /제12조 \(부칙\)/);
  assert.equal(content.match(/title:\s*"제\d+조/g)?.length, 12);
  assert.match(content, /contact@zerofee\.kr/);
  assert.match(content, /시행 일자: 2026년 4월 20일/);
  assert.match(content, /https:\/\/privacy\.kisa\.or\.kr\//);
  assert.match(styles, /focus-visible/);
  assert.match(sharedStyles, /@media \(max-width: 768px\)/);
});

test("the privacy route is linked from the footer and exposed in the sitemap", async () => {
  const [footer, sitemap] = await Promise.all([
    readOrEmpty("../../components/Footer.tsx"),
    readOrEmpty("../api/sitemap/route.ts"),
  ]);

  assert.match(footer, /href="\/privacy"/);
  assert.match(footer, />\s*개인정보처리방침\s*<\/Link>/);
  assert.ok(sitemap.includes('"/privacy"'));
});
