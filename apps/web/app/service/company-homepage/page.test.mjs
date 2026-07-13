import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const componentsUrl = new URL("../../../components/", import.meta.url);
const contentPath = new URL("./content.ts", import.meta.url);
const pagePath = new URL("./page.tsx", import.meta.url);
const pageStylesPath = new URL("./page.module.css", import.meta.url);

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

test("the company homepage page owns its route-only sections", async () => {
  const page = await readFile(pagePath, "utf8");

  assert.doesNotMatch(
    page,
    /import \{ CompanyHomepage(?:Types|SeoGeo|Scope)Section \}/,
  );
  assert.match(page, /import \{ Icon \} from "\.\.\/\.\.\/\.\.\/components\/Icon";/);
  assert.match(
    page,
    /import \{ SectionShell \} from "\.\.\/\.\.\/\.\.\/components\/SectionShell";/,
  );
  assert.match(page, /data-node-id="49:3828"/);
  assert.match(page, /data-node-id="49:4344"/);
  assert.match(page, /data-node-id="49:4396"/);

  for (const file of [
    "CompanyHomepageTypesSection.tsx",
    "CompanyHomepageTypesSection.module.css",
    "CompanyHomepageSeoGeoSection.tsx",
    "CompanyHomepageSeoGeoSection.module.css",
    "CompanyHomepageScopeSection.tsx",
    "CompanyHomepageScopeSection.module.css",
  ]) {
    assert.equal(await exists(new URL(file, componentsUrl)), false, file);
  }
});

test("company homepage data is managed in the route content module", async () => {
  const [content, page] = await Promise.all([
    readOrEmpty(contentPath),
    readFile(pagePath, "utf8"),
  ]);

  assert.match(page, /from "\.\/content";/);

  for (const name of [
    "companyHomepageTypes",
    "companyHomepageScopeItems",
    "companyHomepageFaqs",
  ]) {
    assert.match(content, new RegExp(`export const ${name}`));
    assert.doesNotMatch(page, new RegExp(`const ${name}`));
  }

  assert.match(content, /import type \{ IconName \}/);
  assert.match(
    content,
    /companyHomepageTypes[\s\S]*?as const satisfies readonly \{[\s\S]*?iconName: IconName;/,
  );
  assert.doesNotMatch(content, /<\/?[A-Za-z][^>]*>/);
});

test("the inlined company homepage sections preserve approved visual rules", async () => {
  const [page, styles] = await Promise.all([
    readFile(pagePath, "utf8"),
    readOrEmpty(pageStylesPath),
  ]);

  assert.match(page, /import styles from "\.\.\/\.\.\/page\.module\.css";/);
  assert.match(page, /import companyStyles from "\.\/page\.module\.css";/);
  assert.match(page, /companyStyles\.companyTypesSection/);
  assert.match(page, /companyStyles\.companySeoGeoSection/);
  assert.match(page, /companyStyles\.companyScopeSection/);

  assert.match(
    styles,
    /\.companyTypesGrid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(3, 1fr\);[\s\S]*?gap:\s*20px;[\s\S]*?\}/,
  );
  assert.match(
    styles,
    /\.companyTypesCard\s*\{[\s\S]*?gap:\s*16px;[\s\S]*?padding:\s*24px 32px;[\s\S]*?border-radius:\s*16px;[\s\S]*?\}/,
  );
  assert.match(
    styles,
    /\.companySeoGeoCardDescription\s*\{[\s\S]*?width:\s*400px;[\s\S]*?\}/,
  );
  assert.match(
    styles,
    /@media \(max-width:\s*1080px\)[\s\S]*?\.cards\s*\{[\s\S]*?grid-template-columns:\s*1fr;[\s\S]*?gap:\s*8px;/,
  );
  assert.match(
    styles,
    /\.companyScopeGrid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(5, 1fr\);[\s\S]*?gap:\s*20px;[\s\S]*?\}/,
  );
});
