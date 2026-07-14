import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pagePath = new URL("./page.tsx", import.meta.url);
const clientPath = new URL("./PortfolioListClient.tsx", import.meta.url);

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
