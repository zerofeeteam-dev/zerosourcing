import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const apiPath = new URL("../api/contact/route.ts", import.meta.url);
const pagePath = new URL("./page.tsx", import.meta.url);

test("contact phone input accepts digits and applies the requested format", async () => {
  const [api, page] = await Promise.all([
    readFile(apiPath, "utf8"),
    readFile(pagePath, "utf8"),
  ]);

  assert.match(page, /placeholder: "010-0000-000"/);
  assert.match(page, /value\.replace\(\/\\D\/g, ""\)\.slice\(0, 11\)/);
  assert.match(
    page,
    /textFields\.slice\(2\)\.map[\s\S]*?inputMode=\{field\.id === "phone" \? "numeric" : undefined\}/,
  );
  assert.match(page, /maxLength=\{field\.id === "phone" \? 13 : undefined\}/);
  assert.match(page, /"010-\[0-9\]\{4\}-\[0-9\]\{3,4\}"/);
  assert.match(api, /\^010-\\d\{4\}-\\d\{3,4\}\$/);
});
