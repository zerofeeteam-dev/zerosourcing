import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const componentPath = new URL("./Header.tsx", import.meta.url);
const stylesPath = new URL("./Header.module.css", import.meta.url);

test("header uses only the shared refactored glass surface", async () => {
  const component = await readFile(componentPath, "utf8");
  const styles = await readFile(stylesPath, "utf8");

  assert.match(component, /import \{ GlassSurface \} from "\.\/GlassSurface";/);
  assert.match(component, /<GlassSurface[\s\S]*?as="header"/);
  assert.match(component, /className=\{styles\.header\}/);
  assert.match(component, /radius=\{40\}/);
  assert.match(component, /refract/);

  assert.doesNotMatch(component, /makeHeaderDisplacementMap/);
  assert.doesNotMatch(component, /legacy-header-liquid-glass/);
  assert.doesNotMatch(component, /<feDisplacementMap/);
  assert.doesNotMatch(styles, /legacy-header-liquid-glass/);
  assert.doesNotMatch(styles, /\.legacyFilterDefs/);
});
