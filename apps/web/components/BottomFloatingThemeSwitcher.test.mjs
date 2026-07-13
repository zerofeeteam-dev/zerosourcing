import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const componentUrl = new URL(
  "./BottomFloatingThemeSwitcher.tsx",
  import.meta.url,
);
const stylesUrl = new URL(
  "./BottomFloatingThemeSwitcher.module.css",
  import.meta.url,
);
const homePageUrl = new URL("../app/page.tsx", import.meta.url);

test("home renders the independent bottom floating theme switcher", async () => {
  const [component, homePage] = await Promise.all([
    readFile(componentUrl, "utf8"),
    readFile(homePageUrl, "utf8"),
  ]);

  assert.match(
    component,
    /from "\.\/BottomFloatingThemeSwitcher\.module\.css"/,
  );
  assert.match(
    homePage,
    /import \{ BottomFloatingThemeSwitcher \} from "\.\.\/components\/BottomFloatingThemeSwitcher"/,
  );
  assert.match(homePage, /<BottomFloatingThemeSwitcher \/>/);
});

test("switcher keeps the supplied accessible three-option interaction", async () => {
  const component = await readFile(componentUrl, "utf8");

  for (const icon of ["theme-light", "theme-dark", "theme-dim"]) {
    assert.match(component, new RegExp(`name: "${icon}"`));
  }

  assert.match(component, /type="radio"/);
  assert.match(component, /<legend className=\{styles\.visuallyHidden\}>/);
  assert.match(component, /data-previous-theme=\{previousTheme\}/);
});

test("switcher embeds the CodePen displacement filter verbatim", async () => {
  const component = await readFile(componentUrl, "utf8");

  assert.match(component, /supportsGlassRefraction/);
  assert.match(component, /LIQUID_GLASS_MAP/);
  assert.match(component, /primitiveUnits="objectBoundingBox"/);
  assert.match(component, /stdDeviation="0.04"/);
  assert.match(component, /scale="0.5"/);
  assert.match(component, /xChannelSelector="R"/);
  assert.match(component, /yChannelSelector="G"/);
  assert.doesNotMatch(component, /ensureGlassFilter/);
});

test("switcher drives the page-wide theme like the CodePen", async () => {
  const component = await readFile(componentUrl, "utf8");

  assert.match(component, /document\.documentElement\.dataset\.theme = theme/);
});

test("switcher CSS owns the bottom placement and supplied glass geometry", async () => {
  const styles = await readFile(stylesUrl, "utf8");

  assert.match(styles, /\.switcher\s*\{[\s\S]*?position: fixed;/);
  assert.match(styles, /\.switcher\s*\{[\s\S]*?bottom: calc\(/);
  assert.match(styles, /env\(safe-area-inset-bottom/);
  assert.match(styles, /\.switcher\s*\{[\s\S]*?width: 244px;/);
  assert.match(styles, /\.switcher\s*\{[\s\S]*?height: 70px;/);
  assert.match(styles, /\.option\s*\{[\s\S]*?width: 68px;/);
  assert.match(styles, /\.toggle\s*\{[\s\S]*?width: 84px;/);
  assert.match(styles, /translate: 76px 0;/);
  assert.match(styles, /translate: 152px 0;/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  // The pen has no overflow clipping: it would cut the knob's drop shadow.
  const switcherBlock = styles.match(/\.switcher\s*\{[\s\S]*?\n\}/)?.[0] ?? "";
  assert.doesNotMatch(switcherBlock, /overflow: hidden/);
});
