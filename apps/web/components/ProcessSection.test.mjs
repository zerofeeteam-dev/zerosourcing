import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const processSectionPath = new URL("./ProcessSection.tsx", import.meta.url);
const iconPath = new URL("./Icon.tsx", import.meta.url);

test("MVP process section uses the approved four-week messaging", async () => {
  const processSection = await readFile(processSectionPath, "utf8");

  assert.match(processSection, /<p className=\{styles\.label\}>진행 방식<\/p>/);
  assert.match(processSection, /<h2 className=\{styles\.title\}>왜 4주가 가능할까요\?<\/h2>/);
  assert.match(
    processSection,
    /&apos;빠르다&apos;는 약속을, 기간이 적힌 단계로 증명합니다\./,
  );
});

test("the core feature definition card uses the supplied file edit icon", async () => {
  const [icon, processSection] = await Promise.all([
    readFile(iconPath, "utf8"),
    readFile(processSectionPath, "utf8"),
  ]);

  assert.match(
    processSection,
    /iconName: "file-edit-02",\s*title: "핵심 기능 정의"/,
  );
  assert.match(
    icon,
    /function FileEdit02Icon[\s\S]*?viewBox="0 0 20 20"[\s\S]*?d="M7\.96436 17\.9643[\s\S]*?H10\.9645V15\.2069Z"[\s\S]*?stroke="currentColor"[\s\S]*?strokeWidth="2"/,
  );
});

test("the validation and expansion card uses the supplied line chart icon", async () => {
  const [icon, processSection] = await Promise.all([
    readFile(iconPath, "utf8"),
    readFile(processSectionPath, "utf8"),
  ]);

  assert.match(
    processSection,
    /iconName: "line-chart-up-02",\s*title: "검증 & 확장"/,
  );
  assert.match(
    icon,
    /function LineChartUp02Icon[\s\S]*?viewBox="0 0 20 20"[\s\S]*?d="M2 2V18H18M6 12\.0001L9\.5 8\.5001L12 11\.0001L16\.5001 6\.5"[\s\S]*?stroke="currentColor"[\s\S]*?strokeWidth="2"/,
  );
});
