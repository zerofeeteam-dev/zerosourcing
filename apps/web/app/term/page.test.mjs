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

test("the terms route renders the complete source policy with the shared chrome", async () => {
  const [page, content, styles] = await Promise.all([
    readOrEmpty("./page.tsx"),
    readOrEmpty("./content.ts"),
    readOrEmpty("./page.module.css"),
  ]);

  assert.match(page, /<Header \/>/);
  assert.match(page, /<Footer \/>/);
  assert.match(page, /<h1[^>]*>이용약관<\/h1>/);
  assert.match(page, /termsChapters\.map/);
  assert.match(page, /<section/);
  assert.match(page, /<h2/);
  assert.match(page, /<h3/);
  assert.match(page, /<ol/);
  assert.match(page, /<ul/);

  for (const chapter of [
    "제1장 총칙",
    "제2장 이용계약 및 계정 관리",
    "제3장 서비스 이용 및 결제",
    "제4장 콘텐츠 제공 및 환불 (청약철회)",
    "제5장 크리에이터 정산",
    "제6장 의무 및 권리",
    "제7장 면책 및 기타",
  ]) {
    assert.ok(content.includes(chapter), chapter);
  }

  assert.match(content, /제1조 \(목적\)/);
  assert.match(content, /제19조 \(준거법 및 재판관할\)/);
  assert.equal(content.match(/title: "제\d+조/g)?.length, 19);
  assert.match(content, /본 약관은 2026년 4월 20일부터 시행됩니다\./);
  assert.match(styles, /@media \(max-width: 768px\)/);
});

test("the terms route is linked from the footer and exposed in the sitemap", async () => {
  const [footer, sitemap] = await Promise.all([
    readOrEmpty("../../components/Footer.tsx"),
    readOrEmpty("../sitemap.ts"),
  ]);

  assert.match(footer, /import Link from "next\/link";/);
  assert.match(footer, /href="\/term"/);
  assert.match(footer, />\s*이용약관\s*<\/Link>/);
  assert.ok(sitemap.includes('"/term"'));
});
