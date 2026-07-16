import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const componentsUrl = new URL("../../components/", import.meta.url);
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

test("the About page owns sections that are not reused by another page", async () => {
  const page = await readFile(pagePath, "utf8");

  assert.doesNotMatch(
    page,
    /import \{ About(?:Company|How|Intro|Principles)Section \}/,
  );
  assert.match(page, /import aboutStyles from "\.\/page\.module\.css";/);
  assert.match(page, /import styles from "\.\.\/page\.module\.css";/);

  for (const nodeId of ["20:788", "20:1682", "20:861", "20:896", "20:1376"]) {
    assert.match(page, new RegExp(`data-node-id="${nodeId}"`), nodeId);
  }

  for (const file of [
    "AboutIntroSection.tsx",
    "AboutIntroSection.module.css",
    "AboutPrinciplesSection.tsx",
    "AboutPrinciplesSection.module.css",
    "AboutHowSection.tsx",
    "AboutHowSection.module.css",
    "AboutCompanySection.tsx",
    "AboutCompanySection.module.css",
  ]) {
    assert.equal(await exists(new URL(file, componentsUrl)), false, file);
  }
});

test("About content is JSX-free route data exported as const", async () => {
  const [content, page] = await Promise.all([
    readOrEmpty(contentPath),
    readFile(pagePath, "utf8"),
  ]);

  assert.match(page, /from "\.\/content";/);

  for (const name of [
    "aboutPrinciples",
    "aboutHowItems",
    "aboutProofMetrics",
    "aboutCompanyInfoRows",
    "aboutOffice",
  ]) {
    assert.match(
      content,
      new RegExp(`export const ${name}\\s*=[\\s\\S]*?as const;`),
      name,
    );
  }

  assert.doesNotMatch(content, /<>|<\/?[A-Za-z][A-Za-z0-9]*\b/);
  assert.doesNotMatch(
    page,
    /const (?:principles|howItems|metrics|companyInfo)\s*=/,
  );

  assert.match(content, /name: "제로피\(제로소싱\)"/);
  assert.match(content, /mapCenter: "37\.646768,126\.910328"/);
});

test("inlined About sections preserve approved structure and visual rules", async () => {
  const [page, pageStyles] = await Promise.all([
    readFile(pagePath, "utf8"),
    readOrEmpty(pageStylesPath),
  ]);

  assert.doesNotMatch(pageStyles, /(?:^|\n)\.(?:page|headerLayer)\s*\{/);
  assert.doesNotMatch(pageStyles, /(?:^|\n)\.(?:section|copy)\b/);

  assert.match(
    pageStyles,
    /\.aboutIntroSection\s*\{\s*--section-inner-gap:\s*52px;/,
  );
  assert.match(
    pageStyles,
    /\.aboutPrinciplesSection\s*\{\s*--section-inner-gap:\s*52px;/,
  );
  assert.match(
    pageStyles,
    /\.card\s*\{[\s\S]*?padding:\s*24px 32px;[\s\S]*?border-radius:\s*16px;/,
  );
  assert.match(
    pageStyles,
    /@media \(max-width:\s*640px\)[\s\S]*?\.card\s*\{\s*padding:\s*16px 20px;/,
  );
  assert.match(
    pageStyles,
    /@media \(max-width:\s*479px\)[\s\S]*?\.card\s*\{\s*padding:\s*24px;/,
  );
  assert.match(
    pageStyles,
    /\.infoRow\s*\{[\s\S]*?height:\s*52px;[\s\S]*?padding:\s*0 20px;[\s\S]*?border-bottom:\s*1px dashed var\(--color-gray-100\);/,
  );
  assert.match(
    pageStyles,
    /\.mapFrameWrap\s*\{[\s\S]*?position:\s*relative;/,
  );
  assert.match(page, /className=\{aboutStyles\.mapBadge\}/);
  assert.match(page, /className=\{aboutStyles\.mapBadgeName\}/);
  assert.match(
    pageStyles,
    /\.mapFrame\s*\{[\s\S]*?height:\s*400px;[\s\S]*?pointer-events:\s*none;/,
  );
  assert.match(
    pageStyles,
    /@media \(max-width:\s*560px\)[\s\S]*?\.mapFrame\s*\{\s*height:\s*240px;/,
  );

  assert.match(page, /<ProofPartnerLogoBanner compact \/>/);
  assert.match(page, /allowFullScreen/);
  assert.match(page, /aria-label="제로소싱 사무실 위치"/);
  assert.match(page, /loading="lazy"/);
  assert.match(page, /referrerPolicy="strict-origin-when-cross-origin"/);
  assert.match(page, /tabIndex=\{-1\}/);
});
