import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const categoryNavPath = new URL("./CategoryNav.tsx", import.meta.url);
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

test("the FAQ page owns its route-only category navigation", async () => {
  const page = await readFile(pagePath, "utf8");

  assert.match(page, /^"use client";/);
  assert.doesNotMatch(page, /from "\.\/CategoryNav";/);
  assert.match(page, /function CategoryNav\(/);
  assert.equal(await exists(categoryNavPath), false);
});

test("FAQ content is managed as typed readonly route data", async () => {
  const [content, page] = await Promise.all([
    readOrEmpty(contentPath),
    readFile(pagePath, "utf8"),
  ]);

  assert.match(page, /from "\.\/content";/);

  for (const name of [
    "commonFaqs",
    "pricingFaqs",
    "timelineFaqs",
    "techFaqs",
    "afterLaunchFaqs",
    "mvpFaqs",
    "appFaqs",
    "companyHomepageFaqs",
    "categories",
    "navGroups",
  ]) {
    assert.match(content, new RegExp(`export const ${name}`));
    assert.doesNotMatch(page, new RegExp(`const ${name}`));
  }

  assert.match(content, /import type \{ IconName \}/);
  assert.match(content, /icon: IconName;/);
  assert.match(content, /as const satisfies readonly FaqCategory\[\];/);
  assert.match(content, /as const satisfies readonly FaqCategoryNavGroup\[\];/);
  assert.doesNotMatch(content, /<Icon\b|<br\s*\/?>|<>|<\/\w+>/);
});

test("inlined FAQ navigation preserves sticky and click behavior", async () => {
  const page = await readFile(pagePath, "utf8");

  assert.match(page, /window\.setTimeout\(\(\) => \{[\s\S]*?\}, 140\);/);
  assert.match(
    page,
    /window\.addEventListener\("scroll", handleScroll, \{ passive: true \}\);/,
  );
  assert.match(page, /window\.removeEventListener\("scroll", handleScroll\);/);
  assert.match(
    page,
    /window\.removeEventListener\("resize", readActiveSection\);/,
  );
  assert.doesNotMatch(page, /stickyMode/);
  assert.doesNotMatch(page, /readStickyMode/);
  assert.doesNotMatch(page, /navPanelPinned/);
  assert.match(page, /clearIdleTimer\(\);/);
  assert.match(
    page,
    /window\.matchMedia\("\(prefers-reduced-motion: reduce\)"\)/,
  );
  assert.match(page, /onClick=\{\(\) => handleNavClick\(item\.id\)\}/);
  assert.match(page, /aria-current=\{isActive \? "true" : undefined\}/);
  assert.match(page, /aria-label="FAQ 카테고리"/);

  const summaryTags = [...page.matchAll(/<summary\b[^>]*>/g)].map(
    ([tag]) => tag,
  );
  assert.ok(summaryTags.length > 0);
  for (const tag of summaryTags) {
    assert.doesNotMatch(tag, /onClick=/);
  }
});

test("FAQ DOM and approved visual values stay unchanged", async () => {
  const [page, styles] = await Promise.all([
    readFile(pagePath, "utf8"),
    readFile(pageStylesPath, "utf8"),
  ]);

  for (const nodeId of ["74:6574", "74:6634", "74:6630"]) {
    assert.match(page, new RegExp(`data-node-id="${nodeId}"`));
  }

  assert.match(page, /<details className=\{styles\.faqItem\}>/);
  assert.match(page, /<summary className=\{styles\.summary\}>/);
  assert.match(
    page,
    /<span aria-hidden="true" className=\{styles\.divider\} \/>/,
  );
  assert.match(styles, /\.section\s*\{[\s\S]*?padding:\s*148px 20px 104px;/);
  assert.match(
    styles,
    /\.layout\s*\{[\s\S]*?grid-template-columns:\s*320px minmax\(0, 1020px\);/,
  );
  assert.match(styles, /\.sidebar\s*\{[\s\S]*?position:\s*sticky;[\s\S]*?top:\s*128px;/);
  assert.doesNotMatch(styles, /\.navPanelPinned\b/);
  assert.doesNotMatch(styles, /\.navPanelStopped\b/);
  assert.match(
    styles,
    /\.navItem,[\s\S]*?\.navItemActive\s*\{[\s\S]*?height:\s*52px;[\s\S]*?padding:\s*0 16px;[\s\S]*?border-radius:\s*16px;/,
  );
  assert.match(styles, /\.content\s*\{[\s\S]*?gap:\s*52px;/);
  assert.match(
    styles,
    /\.categorySection\s*\{[\s\S]*?scroll-margin-top:\s*132px;[\s\S]*?gap:\s*8px;/,
  );
  assert.match(
    styles,
    /\.summary\s*\{[\s\S]*?min-height:\s*52px;[\s\S]*?padding:\s*16px 20px;/,
  );
  assert.match(
    styles,
    /\.divider\s*\{[\s\S]*?border-top:\s*1px dashed var\(--color-gray-100\);/,
  );
  assert.match(
    styles,
    /@media \(max-width:\s*1023px\)[\s\S]*?\.sidebar\s*\{[\s\S]*?display:\s*none;/,
  );
  assert.match(styles, /@media \(max-width:\s*768px\)/);
  assert.match(styles, /@media \(max-width:\s*480px\)/);
});
