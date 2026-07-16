import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const stylesPath = new URL("./ServiceCard.module.css", import.meta.url);
const componentPath = new URL("./ServiceCard.tsx", import.meta.url);
const glassStylesPath = new URL("../app/glass.css", import.meta.url);
const layoutPath = new URL("../app/layout.tsx", import.meta.url);

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

test("shared glass utility follows the consumer's dimensions and radius", async () => {
  const glassStyles = await readFile(glassStylesPath, "utf8");
  const surface = glassStyles.match(
    /:where\(\.glass-surface\)\s*\{([\s\S]*?)\}/u,
  )?.[1];
  const highlight = glassStyles.match(
    /:where\(\.glass-surface\)::before\s*\{([\s\S]*?)\}/u,
  )?.[1];

  assert.ok(surface, "Shared glass surface rule is missing");
  for (const expected of [
    /position:\s*relative;/u,
    /display:\s*grid;/u,
    /place-items:\s*center;/u,
    /isolation:\s*isolate;/u,
    /background:\s*rgba\(255,\s*255,\s*255,\s*0\.1\);/u,
    /backdrop-filter:\s*blur\(10px\)\s+saturate\(140%\);/u,
    /-webkit-backdrop-filter:\s*blur\(10px\)\s+saturate\(140%\);/u,
  ]) {
    assert.match(surface, expected);
  }
  assert.doesNotMatch(
    surface,
    /(?:^|\n)\s*(?:width|height|min-width|min-height|max-width|max-height|aspect-ratio|padding|color|box-shadow|border-radius|transition|cursor):/u,
  );

  assert.ok(highlight, "Shared glass highlight is missing");
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
