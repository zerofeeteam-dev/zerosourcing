import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const componentsUrl = new URL("../../../components/", import.meta.url);
const contentPath = new URL("./content.ts", import.meta.url);
const pagePath = new URL("./page.tsx", import.meta.url);
const pageStylesPath = new URL("./page.module.css", import.meta.url);
const markPath = new URL(
  "../../../public/brand/zerofee-service-mark.svg",
  import.meta.url,
);

async function exists(url) {
  try {
    await access(url);
    return true;
  } catch {
    return false;
  }
}

async function readOrEmpty(url) {
  try {
    return await readFile(url, "utf8");
  } catch {
    return "";
  }
}

test("the app page owns sections that are not reused by another page", async () => {
  const page = await readFile(pagePath, "utf8");

  assert.doesNotMatch(
    page,
    /import \{ (?:AppBuildFlowSection|AppHybridAdvantagesSection|NativeFeaturesSection|AppDevelopmentScopeSection) \}/,
  );
  assert.match(page, /<SectionShell/);
  assert.match(page, /<ServicePortfolioSection/);

  for (const file of [
    "AppBuildFlowSection.tsx",
    "AppBuildFlowSection.module.css",
    "AppHybridAdvantagesSection.tsx",
    "AppHybridAdvantagesSection.module.css",
    "NativeFeaturesSection.tsx",
    "NativeFeaturesSection.module.css",
    "AppDevelopmentScopeSection.tsx",
    "AppDevelopmentScopeSection.module.css",
  ]) {
    assert.equal(await exists(new URL(file, componentsUrl)), false, file);
  }
});

test("app page content is managed in the route content module", async () => {
  const [content, page] = await Promise.all([
    readOrEmpty(contentPath),
    readFile(pagePath, "utf8"),
  ]);

  assert.match(page, /from "\.\/content";/);

  for (const name of [
    "appBuildFlowSteps",
    "appHybridAdvantages",
    "appNativeFeatures",
    "appDevelopmentIncludedItems",
    "appDevelopmentDifferences",
    "appFaqs",
  ]) {
    assert.match(content, new RegExp(`export const ${name}`));
    assert.doesNotMatch(page, new RegExp(`const ${name}`));
  }
});

test("the inlined app sections preserve approved visual rules", async () => {
  const [mark, page, styles] = await Promise.all([
    readFile(markPath, "utf8"),
    readFile(pagePath, "utf8"),
    readOrEmpty(pageStylesPath),
  ]);

  assert.match(page, /src="\/brand\/zerofee-service-mark\.svg"/);
  assert.doesNotMatch(page, />\s*Z\s*<\/span>/);
  assert.match(mark, /viewBox="0 0 16 16"/);
  assert.match(
    styles,
    /\.appAdvantageDescription\s*\{[\s\S]*?max-width:\s*795px;[\s\S]*?\}/,
  );
  assert.match(
    styles,
    /\.appNativeFeatureCard\s*\{[\s\S]*?gap:\s*16px;[\s\S]*?\}/,
  );
  assert.match(
    styles,
    /\.appNativeFeatureIconFrame\s*\{[\s\S]*?background:\s*#ffffff;[\s\S]*?color:\s*var\(--color-gray-800\);/u,
  );
  assert.doesNotMatch(styles, /\.appNativeFeatureIconFrame[\s\S]*?:hover/u);
  assert.match(
    styles,
    /@media \(max-width:\s*900px\)[\s\S]*?\.appNativeFeatureCard\s*\{[\s\S]*?gap:\s*8px;/,
  );
  assert.doesNotMatch(
    styles,
    /@media \(max-width:\s*900px\)[\s\S]*?\.appBuildArrow\s*\{[\s\S]*?display:\s*none;/,
  );
  assert.match(
    styles,
    /@media \(max-width:\s*900px\)[\s\S]*?\.appBuildStoreStack\s*\{[\s\S]*?flex-direction:\s*row;/,
  );
  assert.match(
    styles,
    /@media \(max-width:\s*480px\)[\s\S]*?\.appBuildStoreStack\s*\{[\s\S]*?flex-direction:\s*column;/,
  );
});
