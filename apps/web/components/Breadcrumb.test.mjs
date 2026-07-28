import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const componentPath = new URL("./Breadcrumb.tsx", import.meta.url);
const stylesPath = new URL("./Breadcrumb.module.css", import.meta.url);

test("breadcrumb renders linked ancestors and marks the current page", async () => {
  const component = await readFile(componentPath, "utf8");

  assert.match(component, /import Link from "next\/link"/);
  assert.match(component, /<nav aria-label="breadcrumb"/);
  assert.match(component, /<ol/);
  assert.match(
    component,
    /<Link className=\{styles\.link\} href=\{item\.path\}>/,
  );
  assert.match(component, /<span aria-current="page">/);
  assert.match(component, /<span aria-hidden="true"> \/ <\/span>/);
  assert.doesNotMatch(component, /trailingSeparator/);
});

test("breadcrumb links keep the existing visual treatment", async () => {
  const styles = await readFile(stylesPath, "utf8");

  assert.match(styles, /text-decoration: none/);
  assert.doesNotMatch(styles, /:(hover|focus|focus-visible)/);
});
