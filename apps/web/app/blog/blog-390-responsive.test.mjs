import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const blogPagePath = new URL("./page.tsx", import.meta.url);
const blogStylesPath = new URL("./blog.module.css", import.meta.url);
const footerStylesPath = new URL("../../components/Footer.module.css", import.meta.url);

test("blog applies the 390px Figma card geometry only at 480px and below", async () => {
  const [blogPage, blogStyles] = await Promise.all([
    readFile(blogPagePath, "utf8"),
    readFile(blogStylesPath, "utf8"),
  ]);

  assert.match(blogPage, /mobileItemWidth=\{330\}/);
  assert.match(
    blogStyles,
    /@media \(max-width: 480px\)\s*{[\s\S]*?\.headerLayer\s*{\s*padding-inline:\s*20px;[\s\S]*?\.topThumbnail\s*{\s*height:\s*220px;[\s\S]*?\.topCopy\s*{\s*padding-block:\s*8px;[\s\S]*?\.topDescription\s*{\s*line-height:\s*20px;[\s\S]*?\.listThumbnail\s*{\s*height:\s*240px;/,
  );
});

test("footer keeps the 390px policy links at a 16px rhythm", async () => {
  const footerStyles = await readFile(footerStylesPath, "utf8");

  assert.match(
    footerStyles,
    /@media \(max-width: 480px\)\s*{[\s\S]*?\.policyGroup\s*{\s*gap:\s*16px;/,
  );
});
