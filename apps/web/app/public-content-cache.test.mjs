import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const routePaths = [
  "./blog/page.tsx",
  "./portfolio/page.tsx",
  "./blog/[slug]/page.tsx",
  "./portfolio/[slug]/page.tsx",
];

test("public content list and detail routes use one-day ISR", async () => {
  for (const routePath of routePaths) {
    const source = await readFile(new URL(routePath, import.meta.url), "utf8");

    assert.match(source, /export const revalidate = 86400;/);
    assert.doesNotMatch(source, /force-dynamic/);
  }

  for (const routePath of [
    "./blog/[slug]/page.tsx",
    "./portfolio/[slug]/page.tsx",
  ]) {
    const source = await readFile(new URL(routePath, import.meta.url), "utf8");
    assert.match(source, /export function generateStaticParams\(\)/);
    assert.match(source, /return \[\];/);
  }
});

test("the public reader caches by table and keeps a one-day fallback", async () => {
  const source = await readFile(
    new URL("../lib/public-content/postgrest-core.ts", import.meta.url),
    "utf8",
  );

  assert.match(source, /PUBLIC_CONTENT_REVALIDATE_SECONDS = 86_400/);
  assert.match(source, /tags: \[publicContentCacheTag\(table\)\]/);
  assert.match(source, /revalidate: PUBLIC_CONTENT_REVALIDATE_SECONDS/);
  assert.doesNotMatch(source, /cache: "no-store"/);
});

test("admin-authenticated invalidation expires data and affected routes", async () => {
  const source = await readFile(
    new URL("./api/revalidate-public-content/route.ts", import.meta.url),
    "utf8",
  );

  assert.match(source, /rpc\/current_user_is_admin/);
  assert.match(
    source,
    /revalidateTag\(publicContentCacheTag\(table\), \{ expire: 0 \}\)/,
  );
  assert.match(source, /revalidatePath\("\/"\)/);
  assert.match(source, /revalidatePath\(indexPath\)/);
  assert.match(source, /revalidatePath\(`\$\{indexPath\}\/\$\{slug\}`\)/);
});
