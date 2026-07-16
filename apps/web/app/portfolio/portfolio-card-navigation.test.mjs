import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pagePath = new URL("./page.tsx", import.meta.url);
const clientPath = new URL("./PortfolioListClient.tsx", import.meta.url);
const stylesPath = new URL("./page.module.css", import.meta.url);

test("every managed portfolio card links to its published detail slug", async () => {
  const [page, client] = await Promise.all([
    readFile(pagePath, "utf8"),
    readFile(clientPath, "utf8"),
  ]);

  assert.match(page, /getPublishedPortfolios/);
  assert.match(page, /selectPortfolioIndex/);
  assert.doesNotMatch(page, /portfolio-items/);

  assert.match(client, /import Link from "next\/link";/);
  assert.match(
    client,
    /className=\{`\$\{styles\.featured\} \$\{styles\.clickableCard\}`\}/,
  );
  assert.match(client, /href=\{`\/portfolio\/\$\{featured\.slug\}`\}/);
  assert.match(
    client,
    /<Link[\s\S]*?href=\{`\/portfolio\/\$\{item\.slug\}`\}[\s\S]*?>/,
  );
  assert.doesNotMatch(
    client,
    /portfolio-items|useRouter|router\.push|role="link"|tabIndex/,
  );
});

test("featured portfolio tag rows use an 8px gap at every viewport", async () => {
  const styles = await readFile(stylesPath, "utf8");

  assert.match(
    styles,
    /\.tagList\s*\{[^}]*gap:\s*12px;[^}]*\}/,
  );
  assert.match(
    styles,
    /\.featured \.tagList\s*\{[\s\S]*?column-gap:\s*12px;[\s\S]*?row-gap:\s*8px;/,
  );
  assert.doesNotMatch(styles, /@media \(min-width: 481px\)/);
});

test("mobile portfolio filters remain swipeable without a visible scrollbar", async () => {
  const styles = await readFile(stylesPath, "utf8");

  const mobileStyles = styles.match(
    /@media \(max-width: 480px\)\s*\{([\s\S]*)\}\s*$/,
  )?.[1];

  assert.ok(mobileStyles);
  assert.match(
    mobileStyles,
    /\.filterBar\s*\{[\s\S]*?width:\s*calc\(100vw\s*-\s*40px\);[\s\S]*?overflow-x:\s*auto;[\s\S]*?scrollbar-width:\s*none;/,
  );
  assert.match(mobileStyles, /\.filterBar::\-webkit-scrollbar\s*\{[\s\S]*?display:\s*none;/);
});
