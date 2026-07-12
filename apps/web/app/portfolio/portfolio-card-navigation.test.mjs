import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pagePath = new URL("./page.tsx", import.meta.url);

test("portfolio detail cards navigate by click without rendering links", async () => {
  const page = await readFile(pagePath, "utf8");

  assert.doesNotMatch(page, /import Link from "next\/link";/);
  assert.match(page, /import \{ useRouter \} from "next\/navigation";/);
  assert.match(page, /const router = useRouter\(\);/);
  assert.match(
    page,
    /<article[\s\S]*?onClick=\{\(\) => router\.push\(`\/portfolio\/\$\{item\.slug\}`\)\}/,
  );
});
