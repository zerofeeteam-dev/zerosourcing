import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const stylesPath = new URL("./ServiceCard.module.css", import.meta.url);

test("primary service badge uses the blue resting state", async () => {
  const styles = await readFile(stylesPath, "utf8");

  assert.match(
    styles,
    /\.badge\s*\{[\s\S]*?background:\s*var\(--color-brand-500\);[\s\S]*?color:\s*#fefefe;/u,
  );
  assert.match(
    styles,
    /\.card:hover \.badge,[\s\S]*?\.card:focus-within \.badge\s*\{[\s\S]*?background:\s*#ffffff;[\s\S]*?color:\s*var\(--color-brand-500\);/u,
  );
});

test("service icon wrapper uses the requested glass surface", async () => {
  const styles = await readFile(stylesPath, "utf8");
  const iconFrame = styles.match(/\.iconFrame\s*\{([\s\S]*?)\}/u)?.[1];
  const highlight = styles.match(
    /\.iconFrame::before\s*\{([\s\S]*?)\}/u,
  )?.[1];

  assert.ok(iconFrame, "Icon frame rule is missing");
  for (const expected of [
    /position:\s*relative;/u,
    /display:\s*grid;/u,
    /place-items:\s*center;/u,
    /color:\s*var\(--color-gray-800\);/u,
    /isolation:\s*isolate;/u,
    /background:\s*rgba\(255,\s*255,\s*255,\s*0\.1\);/u,
    /backdrop-filter:\s*blur\(10px\)\s+saturate\(140%\);/u,
    /-webkit-backdrop-filter:\s*blur\(10px\)\s+saturate\(140%\);/u,
  ]) {
    assert.match(iconFrame, expected);
  }
  assert.doesNotMatch(iconFrame, /box-shadow:/u);

  assert.ok(highlight, "Icon frame highlight is missing");
  for (const expected of [
    /content:\s*"";/u,
    /position:\s*absolute;/u,
    /inset:\s*0;/u,
    /border-radius:\s*inherit;/u,
    /padding:\s*1px;/u,
    /linear-gradient\(\s*135deg,/u,
    /-webkit-mask-composite:\s*xor;/u,
    /mask-composite:\s*exclude;/u,
    /pointer-events:\s*none;/u,
  ]) {
    assert.match(highlight, expected);
  }
});
