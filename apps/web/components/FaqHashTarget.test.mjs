import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const componentPath = new URL("./FaqHashTarget.tsx", import.meta.url);

test("the FAQ hash target opens direct details links without rendering UI", async () => {
  const component = await readFile(componentPath, "utf8");

  assert.match(component, /^"use client";/);
  assert.match(component, /target instanceof HTMLDetailsElement/);
  assert.match(component, /target\.open = true/);
  assert.match(component, /addEventListener\("hashchange"/);
  assert.match(component, /removeEventListener\("hashchange"/);
  assert.match(component, /return null;/);
});
