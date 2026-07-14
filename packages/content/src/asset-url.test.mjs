import assert from "node:assert/strict";
import test from "node:test";
import { createContentAssetBaseUrl } from "./asset-url.ts";

function createInput(supabaseUrl) {
  return {
    assetScope: "scope",
    bucket: "zerosourcing",
    entity: "portfolio",
    supabaseUrl,
  };
}

test("builds the encoded public Storage scope URL", () => {
  assert.equal(
    createContentAssetBaseUrl({
      assetScope: "scope/한글",
      bucket: "zero sourcing",
      entity: "blog",
      supabaseUrl: "https://project.supabase.co/nested/path",
    }),
    "https://project.supabase.co/storage/v1/object/public/zero%20sourcing/content/blog/scope%2F%ED%95%9C%EA%B8%80/",
  );
});

test("accepts HTTP when the URL has a hostname", () => {
  assert.equal(
    createContentAssetBaseUrl({
      ...createInput("http://localhost:54321/nested?query=1#section"),
      entity: "blog",
    }),
    "http://localhost:54321/storage/v1/object/public/zerosourcing/content/blog/scope/",
  );
});

test("rejects an invalid Supabase URL", () => {
  assert.throws(() => createContentAssetBaseUrl(createInput("not a URL")), {
    message: "A valid Supabase URL is required.",
  });
});

for (const [scheme, supabaseUrl] of [
  ["file", "file:///tmp/project"],
  ["ftp", "ftp://project.supabase.co"],
  ["mailto", "mailto:owner@example.com"],
  ["data", "data:text/plain,supabase"],
]) {
  test(`rejects the ${scheme}: scheme`, () => {
    assert.throws(() => createContentAssetBaseUrl(createInput(supabaseUrl)), {
      message: "A valid Supabase URL is required.",
    });
  });
}
