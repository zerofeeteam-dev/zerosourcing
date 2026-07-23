import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const blogClientPath = new URL("./BlogListClient.tsx", import.meta.url);
const blogStylesPath = new URL("./blog.module.css", import.meta.url);

test("blog list keeps the empty sidebar behind a disabled feature flag", async () => {
  const [client, styles] = await Promise.all([
    readFile(blogClientPath, "utf8"),
    readFile(blogStylesPath, "utf8"),
  ]);

  assert.match(client, /const BLOG_SIDEBAR_ENABLED = false;/u);
  assert.match(
    client,
    /BLOG_SIDEBAR_ENABLED \? \([\s\S]*?<aside className=\{styles\.stickyColumn\} aria-hidden="true" \/>[\s\S]*?\) : null/u,
  );
  assert.match(
    styles,
    /\.stickyColumn\s*\{[\s\S]*?position:\s*sticky;[\s\S]*?top:\s*120px;[\s\S]*?height:\s*360px;/u,
  );
});
