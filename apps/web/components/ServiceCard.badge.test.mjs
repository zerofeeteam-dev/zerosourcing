import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const componentPath = new URL("./ServiceCard.tsx", import.meta.url);
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

test("service icon frame keeps a white surface and turns brand blue on hover", async () => {
  const [component, styles] = await Promise.all([
    readFile(componentPath, "utf8"),
    readFile(stylesPath, "utf8"),
  ]);

  assert.doesNotMatch(component, /glass-surface/u);
  assert.match(
    styles,
    /\.iconFrame\s*\{[\s\S]*?background:\s*#ffffff;[\s\S]*?color:\s*var\(--color-gray-800\);/u,
  );
  assert.match(
    styles,
    /\.card:hover \.iconFrame,[\s\S]*?\.card:focus-within \.iconFrame\s*\{[\s\S]*?color:\s*var\(--color-brand-500\);/u,
  );
});
