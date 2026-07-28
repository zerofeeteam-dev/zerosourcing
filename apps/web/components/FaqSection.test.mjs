import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const componentPath = new URL("./FaqSection.tsx", import.meta.url);
const stylesPath = new URL("./FaqSection.module.css", import.meta.url);

test("the shared FAQ renderer exposes stable semantic anchors", async () => {
  const [component, styles] = await Promise.all([
    readFile(componentPath, "utf8"),
    readFile(stylesPath, "utf8"),
  ]);

  assert.match(component, /id=\{faq\.id\}/);
  assert.match(component, /<h3 className=\{styles\.question\}>/);
  assert.doesNotMatch(component, /<span className=\{styles\.question\}>/);
  assert.match(component, /<FaqHashTarget \/>/);
  assert.match(styles, /\.item\s*\{[\s\S]*?scroll-margin-top:\s*132px;/);
  assert.match(styles, /\.question\s*\{[\s\S]*?margin:\s*0;/);
});
