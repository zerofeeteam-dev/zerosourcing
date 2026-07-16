import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const blogStylesPath = new URL("./blog.module.css", import.meta.url);

test("blog list cards match the 768px Figma geometry", async () => {
  const blogStyles = await readFile(blogStylesPath, "utf8");

  assert.match(
    blogStyles,
    /@media \(max-width: 768px\)\s*{[\s\S]*?\.listCard\s*{\s*align-items:\s*center;/,
  );
  assert.match(
    blogStyles,
    /@media \(max-width: 768px\)\s*{[\s\S]*?\.listThumbnail\s*{\s*width:\s*220px;\s*flex-basis:\s*220px;/,
  );
  assert.match(
    blogStyles,
    /@media \(max-width: 768px\)\s*{[\s\S]*?\.listDescription\s*{\s*line-height:\s*20px;/,
  );
  assert.match(
    blogStyles,
    /@media \(max-width: 768px\)\s*{[\s\S]*?\.postList\s*{\s*gap:\s*52px;/,
  );
});
