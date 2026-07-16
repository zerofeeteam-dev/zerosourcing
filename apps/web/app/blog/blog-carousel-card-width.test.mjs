import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const stylesPath = new URL("./blog.module.css", import.meta.url);

test("blog carousel cards keep the three-card width when fewer posts exist", async () => {
  const styles = await readFile(stylesPath, "utf8");

  assert.match(
    styles,
    /\.topCard\s*\{\s*max-width:\s*346px;/,
  );
});
