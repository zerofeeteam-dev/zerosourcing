import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const componentPath = new URL("./ServicePortfolioSection.tsx", import.meta.url);
const servicePages = [
  {
    path: new URL("../app/service/mvp/page.tsx", import.meta.url),
    portfolioType: "mvp",
  },
  {
    path: new URL("../app/service/app/page.tsx", import.meta.url),
    portfolioType: "application",
  },
  {
    path: new URL("../app/service/company-homepage/page.tsx", import.meta.url),
    portfolioType: "company_homepage",
  },
];

test("service portfolio cards navigate to registered portfolio pages", async () => {
  const component = await readFile(componentPath, "utf8");

  assert.match(component, /import Link from "next\/link";/);
  assert.match(component, /getServicePortfolios/);
  assert.match(component, /portfolioType: PortfolioType/);
  assert.match(component, /await getServicePortfolios\(portfolioType\)/);
  assert.match(component, /<ManagedThumbnail/);
  assert.match(component, /등록된 포트폴리오가 없습니다\./);
  assert.match(
    component,
    /<Link[\s\S]*?href=\{`\/portfolio\/\$\{portfolio\.slug\}`\}[\s\S]*?>/,
  );
  assert.doesNotMatch(component, /const portfolios = \[/);
  assert.doesNotMatch(component, /<article className=\{styles\.card\}/);
});

test("each service route supplies its exact Admin portfolio type", async () => {
  for (const servicePage of servicePages) {
    const page = await readFile(servicePage.path, "utf8");

    assert.match(page, /export const dynamic = "force-dynamic";/);
    assert.match(
      page,
      new RegExp(`portfolioType="${servicePage.portfolioType}"`),
    );
  }
});
