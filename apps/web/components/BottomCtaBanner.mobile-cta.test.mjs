import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const componentPath = new URL("./BottomCtaBanner.tsx", import.meta.url);
const stylesPath = new URL("./BottomCtaBanner.module.css", import.meta.url);

test("BottomCtaBanner keeps eyebrow and actions visible on mobile", async () => {
  const [component, styles] = await Promise.all([
    readFile(componentPath, "utf8"),
    readFile(stylesPath, "utf8"),
  ]);

  assert.match(component, /className=\{styles\.eyebrow\}/u);
  assert.match(component, /className=\{styles\.actions\}/u);
  assert.doesNotMatch(
    styles,
    /data-bottom-floating-cta="visible"[\s\S]*?display:\s*none/u,
  );
});
