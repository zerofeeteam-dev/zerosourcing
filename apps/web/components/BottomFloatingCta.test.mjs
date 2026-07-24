import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const componentPath = new URL("./BottomFloatingCta.tsx", import.meta.url);
const stylesPath = new URL("./BottomFloatingCta.module.css", import.meta.url);
const layoutPath = new URL("../app/layout.tsx", import.meta.url);
const globalsPath = new URL("../app/globals.css", import.meta.url);

test("BottomFloatingCta matches the Figma floating quick inquiry pattern", async () => {
  const [component, styles, layout, globals] = await Promise.all([
    readFile(componentPath, "utf8"),
    readFile(stylesPath, "utf8"),
    readFile(layoutPath, "utf8"),
    readFile(globalsPath, "utf8"),
  ]);

  assert.match(component, /data-node-id="28:2584"/u);
  assert.doesNotMatch(component, /지금 바로 시작하세요/u);
  assert.match(component, /간편 문의하기/u);
  assert.match(component, /emitCtaClick\("quick"\)/u);
  assert.match(component, /name="message-typing"/u);
  assert.match(component, /shouldShowBottomFloatingCta/u);
  assert.match(component, /pathname === "\/"/u);
  assert.match(component, /pathname === "\/faq"/u);
  assert.match(component, /pathname === "\/portfolio"/u);
  assert.match(component, /pathname\.startsWith\("\/portfolio\/"\)/u);
  assert.doesNotMatch(component, /buttonShell/u);
  assert.match(
    styles,
    /@media \(max-width: 640px\)[\s\S]*?\.root\s*\{[\s\S]*?display: block;/u,
  );
  assert.match(styles, /\.root[\s\S]*?background: linear-gradient/u);
  assert.match(styles, /\.surface[\s\S]*?width: 100%;/u);
  assert.match(
    styles,
    /\.button[\s\S]*?width: 100%;[\s\S]*?max-width: 350px;[\s\S]*?box-shadow: 22\.5px 22\.5px 30px 0 rgb\(0 0 0 \/ 10%\);/u,
  );
  assert.match(
    styles,
    /@media \(max-width: 640px\)[\s\S]*?\.surface[\s\S]*?padding-inline: 20px;/u,
  );
  assert.doesNotMatch(styles, /margin-inline:/u);
  assert.doesNotMatch(styles, /\.label\s*\{/u);
  assert.match(layout, /BottomFloatingCta/u);
  assert.match(
    globals,
    /body:has\(\[data-bottom-floating-cta="visible"\]\)/u,
  );
  assert.match(globals, /padding-bottom: calc\(104px \+ env\(safe-area-inset-bottom, 0px\)\)/u);
});
