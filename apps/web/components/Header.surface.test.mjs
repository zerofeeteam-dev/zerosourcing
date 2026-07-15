import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const headerPath = new URL("./Header.tsx", import.meta.url);
const stylesPath = new URL("./Header.module.css", import.meta.url);

function firstRule(css, selector) {
  const match = css.match(
    new RegExp("\\." + selector + "\\s*\\{([\\s\\S]*?)\\n\\}", "u"),
  );

  assert.ok(match, "Missing ." + selector + " rule");
  return match[1];
}

test("Header uses Figma's non-liquid-glass surface", async () => {
  const [header, styles] = await Promise.all([
    readFile(headerPath, "utf8"),
    readFile(stylesPath, "utf8"),
  ]);
  const headerRule = firstRule(styles, "header");
  const leftRule = firstRule(styles, "left");

  assert.match(
    header,
    /<header className=\{styles\.header\} data-node-id="611:5728">/u,
  );
  assert.doesNotMatch(
    header,
    /useLayoutEffect|useRef|GlassSurface|ensureLiquidGlassFilter|supportsGlassRefraction|glassFilter|liquidGlassFilter/u,
  );
  assert.doesNotMatch(headerRule, /\bborder:/u);
  assert.match(headerRule, /border-radius: 40px;/u);
  assert.match(headerRule, /background-color: rgb\(255 255 255 \/ 4%\);/u);
  assert.match(headerRule, /-webkit-backdrop-filter: blur\(10px\);/u);
  assert.match(headerRule, /backdrop-filter: blur\(10px\);/u);
  assert.doesNotMatch(
    headerRule,
    /box-shadow:|color-mix|saturate|url\(|--c-glass|--glass-reflex/u,
  );
  assert.match(leftRule, /gap: 32px;/u);
});
