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
