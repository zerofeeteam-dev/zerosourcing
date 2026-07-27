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

test("the privacy route describes the actual inquiry data flow", async () => {
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

  for (const requiredCopy of [
    "기업명",
    "담당자 성명",
    "이메일",
    "연락처",
    "선호 연락 방법",
    "예산",
    "문의 내용",
    "접수일로부터 1년",
    "제3자에게 제공하지 않습니다",
    "Vercel Inc.",
    "Slack Technologies, LLC",
    "미국",
    "contact@zerofee.kr",
    "010-3242-8118",
  ]) {
    assert.ok(content.includes(requiredCopy), requiredCopy);
  }

  assert.equal(content.match(/title:\s*"제\d+조/g)?.length, 13);
  assert.match(content, /문의 내용은 선택 항목/);
  assert.match(
    content,
    /애플리케이션 데이터베이스에는 문의를 저장하지 않습니다/,
  );
  assert.match(content, /시행일: 2026년 7월 27일/);

  for (const obsoleteTerm of [
    "카카오 간편 로그인",
    "닉네임",
    "빌링키",
    "정산 계좌",
    "토스페이먼츠",
    "링크허브",
    "마이페이지",
    "탈퇴하기",
    "맞춤형 서비스",
    "Bubble",
    "AWS",
  ]) {
    assert.ok(!content.includes(obsoleteTerm), obsoleteTerm);
  }

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
