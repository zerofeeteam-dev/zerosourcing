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
  assert.match(page, /주민등록번호, 계좌·카드정보, 건강정보/);
  assert.match(page, /href="\/privacy\/consent#collection-use"/);
  assert.match(page, /href="\/privacy\/consent#overseas-transfer"/);
  assert.equal(page.match(/>\s*보기\s*<\/Link>/g)?.length, 2);
  assert.doesNotMatch(page, /<details|<summary/);

  assert.match(api, /data\.privacyConsent !== true/);
  assert.match(api, /data\.overseasTransferConsent !== true/);
  assert.match(styles, /\.consentLink/);
  assert.match(styles, /color: var\(--color-gray-400\)/);
  assert.match(styles, /text-decoration: underline/);
  assert.match(styles, /focus-visible/);
});
