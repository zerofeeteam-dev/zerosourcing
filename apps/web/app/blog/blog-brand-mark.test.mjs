import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const blogMarkSrc = "/brand/zerofee-blog-mark.svg";
const blogListPagePath = new URL("./BlogListClient.tsx", import.meta.url);
const blogDetailPagePath = new URL("./[slug]/page.tsx", import.meta.url);
const blogMarkAssetPath = new URL(
  "../../public/brand/zerofee-blog-mark.svg",
  import.meta.url,
);

test("blog metadata uses the supplied Zerofee brand mark", async () => {
  const [blogListPage, blogDetailPage, blogMark] = await Promise.all([
    readFile(blogListPagePath, "utf8"),
    readFile(blogDetailPagePath, "utf8"),
    readFile(blogMarkAssetPath, "utf8"),
  ]);

  for (const page of [blogListPage, blogDetailPage]) {
    assert.match(page, new RegExp(`src=${JSON.stringify(blogMarkSrc)}`));
    assert.match(page, /<Image/);
  }

  assert.match(blogMark, /<svg width="16" height="16" viewBox="0 0 16 16"/);
  assert.match(blogMark, /fill="#0360EF"/);
  assert.match(blogMark, /fill="white"/);
});
