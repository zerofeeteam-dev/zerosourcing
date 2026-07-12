import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const processSectionPath = new URL("./ProcessSection.tsx", import.meta.url);

test("MVP process section uses the approved four-week messaging", async () => {
  const processSection = await readFile(processSectionPath, "utf8");

  assert.match(processSection, /<p className=\{styles\.label\}>진행 방식<\/p>/);
  assert.match(processSection, /<h2 className=\{styles\.title\}>왜 4주가 가능할까요\?<\/h2>/);
  assert.match(
    processSection,
    /&apos;빠르다&apos;는 약속을, 기간이 적힌 단계로 증명합니다\./,
  );
});
