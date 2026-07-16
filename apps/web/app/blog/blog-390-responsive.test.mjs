import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const blogPagePath = new URL("./BlogListClient.tsx", import.meta.url);
const blogStylesPath = new URL("./blog.module.css", import.meta.url);
const footerStylesPath = new URL(
  "../../components/Footer.module.css",
  import.meta.url,
);

test("blog keeps 3:2 image frames while applying 390px card controls", async () => {
  const [blogPage, blogStyles] = await Promise.all([
    readFile(blogPagePath, "utf8"),
    readFile(blogStylesPath, "utf8"),
  ]);

  assert.match(blogPage, /mobileItemWidth=\{330\}/);
  assert.match(
    blogStyles,
    /@media \(max-width: 480px\)\s*{[\s\S]*?\.headerLayer\s*{\s*padding-inline:\s*20px;[\s\S]*?\.topCopy\s*{\s*padding-block:\s*8px;[\s\S]*?\.topDescription\s*{\s*line-height:\s*20px;/,
  );
  assert.doesNotMatch(
    blogStyles,
    /@media \(max-width: 480px\)\s*{[\s\S]*?\.(?:topThumbnail|listThumbnail)\s*{[\s\S]*?height:/,
  );
});

test("footer keeps the 390px policy links at a 16px rhythm", async () => {
  const footerStyles = await readFile(footerStylesPath, "utf8");

  assert.match(
    footerStyles,
    /@media \(max-width: 480px\)\s*{[\s\S]*?\.policyGroup\s*{\s*gap:\s*16px;/,
  );
});
