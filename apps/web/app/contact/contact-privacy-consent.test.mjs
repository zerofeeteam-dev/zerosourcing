import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pagePath = new URL("./page.tsx", import.meta.url);
const stylesPath = new URL("./page.module.css", import.meta.url);
const apiPath = new URL("../api/contact/route.ts", import.meta.url);

test("the contact form discloses collection and overseas transfer before submit", async () => {
  const [page, styles, api] = await Promise.all([
    readFile(pagePath, "utf8"),
    readFile(stylesPath, "utf8"),
    readFile(apiPath, "utf8"),
  ]);

  assert.match(page, /name="privacyConsent"/);
  assert.match(page, /name="overseasTransferConsent"/);
  assert.equal(
    page.match(/name="(?:privacyConsent|overseasTransferConsent)"/g)?.length,
    2,
  );
  assert.match(page, /개인정보 수집·이용 동의/);
  assert.match(page, /개인정보 국외 이전 동의/);
  assert.match(page, /외주 개발 상담 접수, 연락 및 견적 검토/);
  assert.match(page, /접수일로부터 1년/);
  assert.match(page, /Vercel Inc\./);
  assert.match(page, /Slack Technologies, LLC/);
  assert.match(page, /미국/);
  assert.match(page, /문의 내용은 선택 항목/);
  assert.match(page, /주민등록번호, 계좌·카드정보, 건강정보/);
  assert.match(page, /<details/);
  assert.match(page, /<summary/);
  assert.doesNotMatch(page, /<button[^>]*className=\{styles\.privacyLink\}/);

  assert.match(api, /data\.privacyConsent !== true/);
  assert.match(api, /data\.overseasTransferConsent !== true/);
  assert.match(styles, /\.consentDetails/);
  assert.match(styles, /focus-visible/);
});
