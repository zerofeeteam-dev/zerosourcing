import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const componentsUrl = new URL("./", import.meta.url);
const webAppUrl = new URL("../app/", import.meta.url);

async function exists(url) {
  try {
    await access(url);
    return true;
  } catch {
    return false;
  }
}

test("the MVP page owns sections that are not reused by another page", async () => {
  const page = await readFile(
    new URL("service/mvp/page.tsx", webAppUrl),
    "utf8",
  );

  assert.doesNotMatch(
    page,
    /import \{ Mvp(?:Intro|Funding|Included)Section \}/,
  );
  assert.match(page, /label="MVP란 무엇인가"/);
  assert.match(page, /label="정부지원사업과 MVP"/);
  assert.match(page, /label="무엇이 포함되나요"/);

  for (const file of [
    "MvpIntroSection.tsx",
    "MvpFundingSection.tsx",
    "MvpIncludedSection.tsx",
    "InfoCard.tsx",
  ]) {
    assert.equal(await exists(new URL(file, componentsUrl)), false, file);
  }
});

test("the three service pages share one portfolio section", async () => {
  const [appPage, companyPage, mvpPage] = await Promise.all([
    readFile(new URL("service/app/page.tsx", webAppUrl), "utf8"),
    readFile(new URL("service/company-homepage/page.tsx", webAppUrl), "utf8"),
    readFile(new URL("service/mvp/page.tsx", webAppUrl), "utf8"),
  ]);

  for (const page of [appPage, companyPage, mvpPage]) {
    assert.match(page, /import \{ ServicePortfolioSection \}/);
    assert.match(page, /<ServicePortfolioSection/);
  }

  assert.equal(
    await exists(new URL("ServicePortfolioSection.tsx", componentsUrl)),
    true,
  );
  assert.equal(
    await exists(new URL("ServicePortfolioSection.module.css", componentsUrl)),
    true,
  );

  for (const file of [
    "AppPortfolioSection.tsx",
    "CompanyHomepagePortfolioSection.tsx",
    "MvpPortfolioSection.tsx",
    "MvpPortfolioSection.module.css",
  ]) {
    assert.equal(await exists(new URL(file, componentsUrl)), false, file);
  }
});

test("a process step stays inside its only consumer", async () => {
  const processSection = await readFile(
    new URL("ProcessSection.tsx", componentsUrl),
    "utf8",
  );

  assert.doesNotMatch(processSection, /import \{ ProcessStepCard \}/);
  assert.match(processSection, /<article className=\{styles\.stepCard\}/);
  assert.equal(
    await exists(new URL("ProcessStepCard.tsx", componentsUrl)),
    false,
  );
  assert.equal(
    await exists(new URL("ProcessStepCard.module.css", componentsUrl)),
    false,
  );
});
