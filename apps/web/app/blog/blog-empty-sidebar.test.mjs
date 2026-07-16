import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const blogClientPath = new URL("./BlogListClient.tsx", import.meta.url);
const blogStylesPath = new URL("./blog.module.css", import.meta.url);

test("blog list renders the desktop sticky poster frame", async () => {
  const [client, styles] = await Promise.all([
    readFile(blogClientPath, "utf8"),
    readFile(blogStylesPath, "utf8"),
  ]);

  assert.match(
    client,
    /<aside className=\{styles\.stickyColumn\} aria-hidden="true" \/>/u,
  );
  assert.match(
    styles,
    /\.stickyColumn\s*\{[\s\S]*?position:\s*sticky;[\s\S]*?top:\s*120px;[\s\S]*?height:\s*360px;/u,
  );
  assert.match(
    styles,
    /@media \(max-width: 1079px\)\s*\{[\s\S]*?\.stickyColumn\s*\{\s*display:\s*none;/u,
  );
});
