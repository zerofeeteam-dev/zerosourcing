import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const machineReadableRoutes = [
  ["./llms.txt/route.ts", "createLlmsIndexMarkdown"],
  ["./llms-full.txt/route.ts", "createLlmsFullMarkdown"],
  ["./about.md/route.ts", "createAboutMarkdown"],
  ["./faq.md/route.ts", "createFaqMarkdown"],
  ["./blog.md/route.ts", "createBlogMarkdown"],
  ["./portfolio.md/route.ts", "createPortfolioMarkdown"],
  ["./service/mvp.md/route.ts", 'createServiceMarkdown("mvp")'],
  ["./service/app.md/route.ts", 'createServiceMarkdown("app")'],
  [
    "./service/company-homepage.md/route.ts",
    'createServiceMarkdown("companyHomepage")',
  ],
];

test("machine-readable routes render through the shared response boundary", async () => {
  for (const [path, generator] of machineReadableRoutes) {
    const source = await readFile(new URL(path, import.meta.url), "utf8");

    assert.match(source, /export (?:async )?function GET\(\)/, path);
    assert.match(source, /createLlmsResponse/, path);
    assert.ok(source.includes(generator), `${path}: ${generator}`);
  }
});

test("dynamic indexes use the failure-tolerant public content loader", async () => {
  for (const path of [
    "./llms-full.txt/route.ts",
    "./blog.md/route.ts",
    "./portfolio.md/route.ts",
  ]) {
    const source = await readFile(new URL(path, import.meta.url), "utf8");

    assert.match(source, /loadLlmsPublicContent\(\)/, path);
    assert.match(source, /partial:/, path);
  }
});
