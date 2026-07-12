import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const blogStylesPath = new URL("./blog.module.css", import.meta.url);

test("featured blog descriptions are limited to two lines", async () => {
  const blogStyles = await readFile(blogStylesPath, "utf8");

  assert.match(
    blogStyles,
    /\.featuredDescription\s*{[^}]*overflow:\s*hidden;[^}]*display:\s*-webkit-box;[^}]*-webkit-box-orient:\s*vertical;[^}]*-webkit-line-clamp:\s*2;/,
  );
});
