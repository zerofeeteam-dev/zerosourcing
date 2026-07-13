import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const routeUrl = new URL("./", import.meta.url);

async function readOrEmpty(relativePath) {
  try {
    return await readFile(new URL(relativePath, routeUrl), "utf8");
  } catch {
    return "";
  }
}

test("liquid glass route owns the standalone CodePen reproduction", async () => {
  const page = await readOrEmpty("page.tsx");

  assert.match(page, /export const metadata: Metadata/);
  assert.match(page, /<LiquidGlassSwitcher \/>/);
  assert.match(page, /<article className=\{styles\.article\}>/);
  assert.match(page, /Liquid glass/);
});

test("switcher exposes three accessible native theme radios", async () => {
  const [switcher, iconRegistry] = await Promise.all([
    readOrEmpty("LiquidGlassSwitcher.tsx"),
    readOrEmpty("../../components/Icon.tsx"),
  ]);

  assert.equal(switcher.match(/type="radio"/g)?.length, 3);
  assert.match(switcher, /aria-label="Light theme"/);
  assert.match(switcher, /aria-label="Dark theme"/);
  assert.match(switcher, /aria-label="Dim theme"/);
  assert.match(switcher, /<Icon name="theme-light"/);
  assert.match(switcher, /<Icon name="theme-dark"/);
  assert.match(switcher, /<Icon name="theme-dim"/);
  assert.match(switcher, /data-previous="1"/);
  assert.match(switcher, /addEventListener\("change"/);
  assert.match(switcher, /element\.dataset\.previous = currentOption/);
  assert.match(switcher, /ensureGlassFilter/);

  for (const name of ["theme-light", "theme-dark", "theme-dim"]) {
    assert.match(iconRegistry, new RegExp(`"${name}"`));
  }
});

test("route styles preserve the CodePen geometry, themes, and motion", async () => {
  const styles = await readOrEmpty("page.module.css");

  assert.match(styles, /\.switcher\s*\{[\s\S]*?width: 244px;/);
  assert.match(styles, /\.switcher\s*\{[\s\S]*?height: 70px;/);
  assert.match(styles, /\.option\s*\{[\s\S]*?width: 68px;/);
  assert.match(styles, /\.toggle\s*\{[\s\S]*?width: 84px;/);
  assert.match(styles, /translate: 76px 0;/);
  assert.match(styles, /translate: 152px 0;/);
  assert.match(styles, /backdrop-filter:[\s\S]*?blur\(8px\)[\s\S]*?saturate/);
  assert.match(styles, /\.page:has\(input\[value="dark"\]:checked\)/);
  assert.match(styles, /\.page:has\(input\[value="dim"\]:checked\)/);
  assert.match(styles, /:focus-visible/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
});
