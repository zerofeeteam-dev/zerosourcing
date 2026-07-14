import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const blogClientPath = new URL("./BlogListClient.tsx", import.meta.url);
const blogStylesPath = new URL("./blog.module.css", import.meta.url);

test("blog list does not render an empty desktop sidebar placeholder", async () => {
  const [client, styles] = await Promise.all([
    readFile(blogClientPath, "utf8"),
    readFile(blogStylesPath, "utf8"),
  ]);

  assert.doesNotMatch(client, /className=\{styles\.stickyColumn\}/u);
  assert.doesNotMatch(client, /<aside[^>]*aria-hidden="true"[^>]*\/>/u);
  assert.doesNotMatch(styles, /\.stickyColumn\b/u);
});
