import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const partnerLogosPath = new URL("./partner-logos.ts", import.meta.url);

test("partner logo data includes the three proof-partner assets", async () => {
  const partnerLogos = await readFile(partnerLogosPath, "utf8");

  assert.match(
    partnerLogos,
    /alt: "토스페이먼츠 제로소싱 고객사",\s*src: "\/images\/partners\/tosspayments-partners-logo\.png",\s*width: 220,\s*height: 52,/,
  );
  assert.match(
    partnerLogos,
    /alt: "나이스페이 제로소싱 고객사",\s*src: "\/images\/partners\/nicepay-partners-logo\.png",\s*width: 180,\s*height: 52,/,
  );
  assert.match(
    partnerLogos,
    /alt: "고양특례시 제로소싱 고객사",\s*src: "\/images\/partners\/goyang-city-partners-logo\.png",\s*width: 160,\s*height: 52,/,
  );
});
