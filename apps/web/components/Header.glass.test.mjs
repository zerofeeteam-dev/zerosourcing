import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const componentUrl = new URL("./Header.tsx", import.meta.url);
const stylesUrl = new URL("./Header.module.css", import.meta.url);
const filterUrl = new URL("./liquidGlassFilter.ts", import.meta.url);

test("header refracts through the size-aware CodePen material", async () => {
  const component = await readFile(componentUrl, "utf8");

  assert.match(component, /<header/);
  assert.match(component, /supportsGlassRefraction/);
  assert.match(component, /ensureLiquidGlassFilter\(\{ width, height \}\)/);
  assert.match(
    component,
    /blur\(8px\) url\("#\$\{filterId\}"\) saturate\(var\(--saturation\)\)/,
  );
  assert.match(component, /new ResizeObserver/);
  assert.doesNotMatch(component, /\bensureGlassFilter\b/);
  assert.doesNotMatch(component, /GlassSurface/);
});

test("filter module recuts the pen map instead of stretching it", async () => {
  const filterModule = await readFile(filterUrl, "utf8");

  assert.match(filterModule, /LIQUID_GLASS_MAP/);
  assert.match(filterModule, /"primitiveUnits", "objectBoundingBox"/);
  assert.match(filterModule, /"scale", "0.5"/);
  assert.match(filterModule, /"xChannelSelector", "R"/);
  assert.match(filterModule, /"yChannelSelector", "G"/);
  // 3-slice composition: caps copied 1:1, only the body stretches.
  assert.match(filterModule, /drawImage/);
  // R channel rescale pins x displacement to the pen's pixel strength.
  assert.match(filterModule, /PEN_WIDTH \/ width/);
});

test("header CSS owns the pen surface and reacts to the page theme", async () => {
  const styles = await readFile(stylesUrl, "utf8");

  assert.match(
    styles,
    /background-color: color-mix\(in srgb, var\(--c-glass\) 12%, transparent\);/,
  );
  assert.match(styles, /backdrop-filter: blur\(8px\) saturate\(var\(--saturation\)\);/);
  assert.match(styles, /calc\(var\(--glass-reflex-light\) \* 90%\)/);
  assert.match(styles, /calc\(var\(--glass-reflex-dark\) \* 8%\)/);
  assert.match(styles, /:root\[data-theme="dark"\] \.header/);
  assert.match(styles, /:root\[data-theme="dim"\] \.header/);
  assert.match(styles, /--header-content/);
});
