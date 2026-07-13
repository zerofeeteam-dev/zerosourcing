import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const appIconPath = new URL("./icon.png", import.meta.url);
const legacyFaviconPath = new URL("./favicon.ico", import.meta.url);
const sourceFaviconPath = new URL("../public/favicon.png", import.meta.url);

async function exists(url) {
  try {
    await access(url);
    return true;
  } catch {
    return false;
  }
}

test("the root route uses the provided PNG as its favicon", async () => {
  assert.equal(await exists(appIconPath), true, "app/icon.png is missing");

  const [appIcon, sourceFavicon] = await Promise.all([
    readFile(appIconPath),
    readFile(sourceFaviconPath),
  ]);

  assert.deepEqual(appIcon, sourceFavicon);
  assert.equal(
    await exists(legacyFaviconPath),
    false,
    "the legacy favicon.ico overrides app/icon.png",
  );
});
