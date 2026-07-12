import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const componentPath = new URL("./VideoBanner.tsx", import.meta.url);
const stylesPath = new URL("./VideoBanner.module.css", import.meta.url);

test("video banner eyebrow uses the shared light liquid-glass refraction", async () => {
  const component = await readFile(componentPath, "utf8");

  assert.match(component, /import \{ GlassSurface \} from "\.\/GlassSurface";/);
  assert.match(component, /<GlassSurface[\s\S]*?className=\{styles\.eyebrowChip\}/);
  assert.match(component, /bezel=\{10\}/);
  assert.match(component, /blur=\{2\}/);
  assert.match(component, /radius=\{32\}/);
  assert.match(component, /refract/);
  assert.match(component, /saturate=\{1\.4\}/);
  assert.match(component, /scale=\{30\}/);
  assert.match(component, /tone="light"/);
});

test("video banner eyebrow keeps the shared liquid-glass shadow", async () => {
  const styles = await readFile(stylesPath, "utf8");
  const chipBlock = styles.match(/\.eyebrowChip\s*\{([^}]*)\}/)?.[1];
  const textBlock = styles.match(/\.eyebrow\s*\{([^}]*)\}/)?.[1];

  assert.ok(chipBlock, "eyebrowChip style block is required");
  assert.match(chipBlock, /height:\s*40px;/);
  assert.match(chipBlock, /padding:\s*8px 16px;/);
  assert.match(chipBlock, /gap:\s*4px;/);
  assert.match(chipBlock, /border-radius:\s*32px;/);
  assert.doesNotMatch(chipBlock, /box-shadow\s*:/);
  assert.doesNotMatch(chipBlock, /background\s*:/);

  assert.ok(textBlock, "eyebrow text style block is required");
  assert.match(textBlock, /color:\s*var\(--color-gray-800\);/);
  assert.match(textBlock, /position:\s*relative;/);
  assert.match(textBlock, /z-index:\s*3;/);
});

test("video banner renders only the shared refactored eyebrow chip", async () => {
  const component = await readFile(componentPath, "utf8");
  const styles = await readFile(stylesPath, "utf8");

  assert.equal(component.match(/<GlassSurface/g)?.length, 1);
  assert.doesNotMatch(component, /makeLegacyDisplacementMap/);
  assert.doesNotMatch(component, /LegacyGlassEyebrow/);
  assert.doesNotMatch(component, /legacy-liquid-glass/);
  assert.doesNotMatch(component, /<feDisplacementMap/);
  assert.doesNotMatch(styles, /\.eyebrowComparison/);
  assert.doesNotMatch(styles, /\.legacyEyebrowChip/);
  assert.doesNotMatch(styles, /\.legacyFilterDefs/);
});
