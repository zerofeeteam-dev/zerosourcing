import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const blogStylesPath = new URL("./blog.module.css", import.meta.url);

test("blog title uses the bold-24 size at 768px and below", async () => {
  const blogStyles = await readFile(blogStylesPath, "utf8");

  assert.match(
    blogStyles,
    /@media \(max-width: 768px\)\s*{[\s\S]*?\.title\s*{\s*font-size:\s*24px;\s*line-height:\s*32px;/,
  );
});
