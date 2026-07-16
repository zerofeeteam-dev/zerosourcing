import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const componentPath = new URL("./BottomCtaBanner.tsx", import.meta.url);
const stylesPath = new URL("./BottomCtaBanner.module.css", import.meta.url);

test("BottomCtaBanner hides duplicate mobile CTA chrome when floating CTA is visible", async () => {
  const [component, styles] = await Promise.all([
    readFile(componentPath, "utf8"),
    readFile(stylesPath, "utf8"),
  ]);

  assert.match(component, /className=\{styles\.eyebrow\}/u);
  assert.match(
    styles,
    /:global\(body:has\(\[data-bottom-floating-cta="visible"\]\)\) \.eyebrow,[\s\S]*?:global\(body:has\(\[data-bottom-floating-cta="visible"\]\)\) \.actions[\s\S]*?display: none;/u,
  );
  assert.match(
    styles,
    /:global\(body:has\(\[data-bottom-floating-cta="visible"\]\)\) \.content[\s\S]*?padding-bottom: 120px;/u,
  );
});
