import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const aboutPagePath = new URL("../app/about/page.tsx", import.meta.url);
const componentPath = new URL("./ProofPartnerLogoBanner.tsx", import.meta.url);
const stylesPath = new URL("./ProofPartnerLogoBanner.module.css", import.meta.url);

test("About uses the ProofPartnerLogoBanner compact 72px padding variant", async () => {
  const [aboutPage, component, styles] = await Promise.all([
    readFile(aboutPagePath, "utf8"),
    readFile(componentPath, "utf8"),
    readFile(stylesPath, "utf8"),
  ]);

  assert.match(aboutPage, /<ProofPartnerLogoBanner compact \/>/);
  assert.match(component, /compact\?: boolean/);
  assert.match(component, /compact \? `\$\{styles\.root\} \$\{styles\.compact\}` : styles\.root/);
  assert.match(styles, /\.compact\s*{\s*padding:\s*72px 0;/);
});
