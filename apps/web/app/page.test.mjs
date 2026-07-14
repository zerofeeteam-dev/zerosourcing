import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const componentsUrl = new URL("../components/", import.meta.url);
const contentPath = new URL("./content.ts", import.meta.url);
const faqSectionPath = new URL("../components/FaqSection.tsx", import.meta.url);
const ogImagePath = new URL("../public/og.png", import.meta.url);
const pagePath = new URL("./page.tsx", import.meta.url);
const pageStylesPath = new URL("./page.module.css", import.meta.url);
const partnerLogosPath = new URL(
  "../components/partner-logos.ts",
  import.meta.url,
);
const proofMetricsPath = new URL(
  "../components/ProofMetrics.tsx",
  import.meta.url,
);
const scopeIconPath = new URL(
  "../public/figma-assets/zerosourcing-feature-mark.svg",
  import.meta.url,
);

const homeTitle = "제로소싱 | MVP·앱·홈페이지 개발 외주 파트너";
const homeDescription =
  "MVP 개발 외주 전문 제로소싱. 핵심 기능만 담아 평균 4주 만에 출시·검증합니다. 앱·기업 홈페이지·강의·쇼핑몰까지, 기능별 정찰가로 투명하게. 무료 상담으로 시작하세요.";

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

function assertExportUsesAsConst(source, name) {
  const start = source.indexOf(`export const ${name} =`);
  assert.notEqual(start, -1, `${name} export is missing`);

  const nextExport = source.indexOf("export const ", start + 1);
  const declaration = source.slice(
    start,
    nextExport === -1 ? source.length : nextExport,
  );
  assert.match(declaration, /as const;/, `${name} must use as const`);
}

test("the home route exports the approved social metadata", async () => {
  const page = await readFile(pagePath, "utf8");

  assert.equal(await exists(ogImagePath), true, "OG image is missing");
  assert.ok(page.includes(JSON.stringify(homeTitle)), "home title is missing");
  assert.ok(
    page.includes(JSON.stringify(homeDescription)),
    "home description is missing",
  );
  assert.match(
    page,
    /export const metadata = createPageMetadata\(\{[\s\S]*?title: homeTitle,[\s\S]*?description: homeDescription,[\s\S]*?path: "\/",/,
  );
});

test("the home route owns sections that are not reused by another page", async () => {
  const page = await readFile(pagePath, "utf8");

  assert.doesNotMatch(
    page,
    /import \{ (?:ListeningSection|ProofSection|ServiceScopeSection|PortfolioSection|InsightSection|PartnerLogoRollingBanner) \}/,
  );

  for (const sharedComponent of [
    "BusinessTypesSection",
    "CardCarousel",
    "ProcessSection",
    "ProofMetrics",
    "ProofPartnerLogoBanner",
    "SectionShell",
  ]) {
    assert.match(
      page,
      new RegExp(`import \\{ ${sharedComponent} \\}`),
      `${sharedComponent} should remain shared`,
    );
  }

  const orderedNodeIds = [
    "291:54079",
    "138:4549",
    "138:4630",
    "138:4957",
    "138:5026",
  ];
  let previousIndex = -1;
  for (const nodeId of orderedNodeIds) {
    const index = page.indexOf(`data-node-id="${nodeId}"`);
    assert.ok(index > previousIndex, `${nodeId} must keep its DOM order`);
    previousIndex = index;
  }
});

test("home-only component files are removed after their markup is inlined", async () => {
  for (const component of [
    "ListeningSection",
    "ProofSection",
    "ServiceScopeSection",
    "PortfolioSection",
    "InsightSection",
    "PartnerLogoRollingBanner",
  ]) {
    assert.equal(
      await exists(new URL(`${component}.tsx`, componentsUrl)),
      false,
      `${component}.tsx`,
    );
    assert.equal(
      await exists(new URL(`${component}.module.css`, componentsUrl)),
      false,
      `${component}.module.css`,
    );
  }
});

test("home static marketing content stays JSX-free and managed cards use public queries", async () => {
  const [content, page] = await Promise.all([
    readOrEmpty(contentPath),
    readFile(pagePath, "utf8"),
  ]);

  assert.match(page, /from "\.\/content";/);

  for (const name of [
    "homeProblemQuotes",
    "homeProofMetrics",
    "homeReviews",
    "homeServiceScopeSteps",
    "homeFaqs",
  ]) {
    assertExportUsesAsConst(content, name);
    assert.doesNotMatch(page, new RegExp(`const ${name}`));
  }

  assert.doesNotMatch(content, /export const homePortfolios/);
  assert.doesNotMatch(content, /export const homeInsights/);
  assert.match(page, /getPublishedPortfolios/);
  assert.match(page, /getPublishedBlogPosts/);
  assert.match(page, /selectHomePortfolios/);
  assert.match(page, /selectHomeBlogPosts/);
  assert.doesNotMatch(content, /ReactNode|<>|<\/?[A-Z][A-Za-z0-9]*/);
  assert.match(page, /<FaqSection items=\{homeFaqs\} \/>/);
});

test("the service scope uses the supplied Zerosourcing feature mark", async () => {
  const [page, scopeIcon] = await Promise.all([
    readFile(pagePath, "utf8"),
    readFile(scopeIconPath, "utf8"),
  ]);

  assert.match(
    page,
    /<Image[\s\S]*?className=\{styles\.featureIcon\}[\s\S]*?src="\/figma-assets\/zerosourcing-feature-mark\.svg"/,
  );
  assert.doesNotMatch(
    page,
    /className=\{styles\.featureIcon\}[\s\S]*?<Icon name="check"/,
  );
  assert.match(scopeIcon, /fill="#0360EF"/);
  assert.match(scopeIcon, /fill="#F8FAFF"/);
});

test("shared data and readonly interfaces no longer depend on home-only files", async () => {
  const [faqSection, partnerLogos, proofMetrics] = await Promise.all([
    readFile(faqSectionPath, "utf8"),
    readFile(partnerLogosPath, "utf8"),
    readFile(proofMetricsPath, "utf8"),
  ]);

  assert.doesNotMatch(faqSection, /const faqs:/);
  assert.match(faqSection, /items: readonly FaqItem\[\];/);
  assert.doesNotMatch(faqSection, /items\?:/);

  assert.match(partnerLogos, /export type PartnerLogo = \{/);
  assert.doesNotMatch(partnerLogos, /from "\.\/PartnerLogoRollingBanner"/);
  assert.match(proofMetrics, /items: readonly ProofMetric\[\];/);
});

test("merged home styles preserve collision ownership and visual values", async () => {
  const styles = await readOrEmpty(pageStylesPath);

  for (const selector of [
    "listeningContent",
    "listeningCard",
    "listeningSummary",
    "listeningSummaryLine",
    "proofContent",
    "scopeSection",
    "scopeContent",
    "scopeDescription",
    "scopeSummary",
    "scopeSummaryLine",
    "portfolioSection",
    "portfolioCard",
    "portfolioCardTitle",
    "portfolioCopy",
    "portfolioDescription",
    "portfolioThumbnail",
    "portfolioTitle",
    "insightContent",
    "insightCard",
    "insightCardTitle",
    "insightCopy",
    "insightDescription",
    "insightThumbnail",
    "partnerLogoTitle",
  ]) {
    assert.match(
      styles,
      new RegExp(`\\.${selector}\\b`),
      `${selector} is missing`,
    );
  }

  assert.doesNotMatch(
    styles,
    /^\.(?:card|cardTitle|content|copy|description|section|summary|summaryLine|thumbnail|title)\b/m,
  );

  assert.match(
    styles,
    /\.cards\s*\{[\s\S]*?grid-template-columns:\s*repeat\(4, 1fr\);/,
  );
  assert.match(
    styles,
    /@media \(max-width:\s*1280px\)[\s\S]*?\.cards\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2, 1fr\);/,
  );
  assert.match(
    styles,
    /@media \(max-width:\s*768px\)[\s\S]*?\.cards\s*\{[\s\S]*?grid-template-columns:\s*1fr;/,
  );
  assert.match(styles, /\.proofContent\s*\{[\s\S]*?gap:\s*52px;/);
  assert.match(
    styles,
    /@media \(max-width:\s*560px\)[\s\S]*?\.proofContent\s*\{[\s\S]*?gap:\s*36px;/,
  );
  assert.match(
    styles,
    /\.scopeSection\s*\{[\s\S]*?--section-padding-y:\s*156px;[\s\S]*?--section-padding-y-tablet:\s*156px;[\s\S]*?--section-padding-y-mobile:\s*108px;/,
  );
  assert.match(styles, /\.portfolioSection\s*\{[\s\S]*?padding:\s*104px 0;/);
  assert.match(
    styles,
    /@media \(max-width:\s*768px\)[\s\S]*?\.portfolioSection\s*\{[\s\S]*?padding:\s*72px 0;/,
  );
  assert.match(styles, /\.insightThumbnail\s*\{[\s\S]*?height:\s*240px;/);
  assert.match(
    styles,
    /@media \(max-width:\s*640px\)[\s\S]*?\.insightThumbnail\s*\{[\s\S]*?height:\s*200px;/,
  );
  assert.match(
    styles,
    /\.track\s*\{[\s\S]*?animation:\s*partnerLogoRoll var\(--partner-logo-duration\) linear infinite;/,
  );
  assert.match(
    styles,
    /@media \(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.track\s*\{[\s\S]*?animation:\s*none;/,
  );
});
