import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const blogStylesPath = new URL("./blog.module.css", import.meta.url);

test("blog list descriptions are limited to two lines at 1079px and below", async () => {
  const blogStyles = await readFile(blogStylesPath, "utf8");

  assert.match(
    blogStyles,
    /@media \(max-width: 1079px\)\s*{[\s\S]*?\.listDescription\s*{[\s\S]*?-webkit-line-clamp:\s*2;/,
  );
});
