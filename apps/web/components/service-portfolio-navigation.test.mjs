import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const componentPath = new URL(
  "./ServicePortfolioSection.tsx",
  import.meta.url,
);

test("service portfolio cards navigate to registered portfolio pages", async () => {
  const component = await readFile(componentPath, "utf8");

  assert.match(component, /import Link from "next\/link";/);
  assert.match(component, /href: "\/portfolio\/meetit-plus"/);
  assert.match(component, /href: "\/portfolio\/todomall"/);
  assert.match(component, /href: "\/portfolio\/gongsa-morakmorak"/);
  assert.match(
    component,
    /<Link[\s\S]*?href=\{portfolio\.href\}[\s\S]*?>/,
  );
  assert.doesNotMatch(component, /<article className=\{styles\.card\}/);
});
