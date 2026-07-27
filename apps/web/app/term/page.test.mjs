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

test("the terms route describes the public outsourcing inquiry site", async () => {
  const [page, content, styles] = await Promise.all([
    readOrEmpty("./page.tsx"),
    readOrEmpty("./content.ts"),
    readOrEmpty("./page.module.css"),
  ]);

  assert.match(page, /<Header \/>/);
  assert.match(page, /<Footer \/>/);
  assert.match(page, /<h1[^>]*>사이트 이용약관<\/h1>/);
  assert.match(page, /termsChapters\.map/);

  for (const title of [
    "제1조 (목적)",
    "제2조 (정의)",
    "제3조 (약관과 개별 계약의 관계)",
    "제4조 (사이트가 제공하는 기능)",
    "제5조 (문의 접수)",
    "제6조 (이용자의 의무)",
    "제7조 (사이트 콘텐츠의 권리)",
    "제8조 (이용자가 제출한 내용)",
    "제9조 (외부 서비스와 링크)",
    "제10조 (책임의 범위)",
    "제11조 (약관의 변경)",
    "제12조 (준거법 및 관할)",
  ]) {
    assert.ok(content.includes(title), title);
  }

  assert.equal(content.match(/title: "제\d+조/g)?.length, 12);
  assert.match(content, /문의 제출만으로 외주 개발 계약이 성립하지 않습니다/);
  assert.match(content, /개별 계약의 내용이 우선합니다/);
  assert.match(content, /개인정보처리방침/);
  assert.match(content, /2026년 7월 27일부터 시행됩니다/);

  for (const obsoleteTerm of [
    "크리에이터",
    "구매자",
    "카카오 로그인",
    "빌링키",
    "링크 페이",
    "정기 결제",
    "청약철회",
    "정산",
  ]) {
    assert.ok(!content.includes(obsoleteTerm), obsoleteTerm);
  }

  assert.match(styles, /@media \(max-width: 768px\)/);
});

test("the terms route is linked from the footer and exposed in the sitemap", async () => {
  const [footer, sitemap] = await Promise.all([
    readOrEmpty("../../components/Footer.tsx"),
    readOrEmpty("../api/sitemap/route.ts"),
  ]);

  assert.match(footer, /import Link from "next\/link";/);
  assert.match(footer, /href="\/term"/);
  assert.match(footer, />\s*이용약관\s*<\/Link>/);
  assert.ok(sitemap.includes('"/term"'));
});
