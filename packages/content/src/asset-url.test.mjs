import assert from "node:assert/strict";
import test from "node:test";
import {
  CONTENT_STORAGE_BUCKET,
  ContentAssetScopeError,
  ContentStorageBucketError,
  contentAssetObjectPrefix,
  createContentAssetBaseUrl,
  isContentAssetScope,
  parseContentAssetScope,
} from "./asset-url.ts";

const scope = "00000000-0000-4000-8000-000000000001";

function createInput(supabaseUrl) {
  return {
    assetScope: scope,
    entity: "portfolio",
    supabaseUrl,
  };
}

test("uses one fixed public Storage bucket", () => {
  assert.equal(CONTENT_STORAGE_BUCKET, "zerosourcing");
});

test("builds the fixed public Storage scope URL", () => {
  assert.equal(
    createContentAssetBaseUrl({
      assetScope: "00000000-0000-4000-8000-00000000ABCD",
      entity: "blog",
      supabaseUrl: "https://project.supabase.co/nested/path?query=1#section",
    }),
    "https://project.supabase.co/storage/v1/object/public/zerosourcing/content/blog/00000000-0000-4000-8000-00000000abcd/",
  );
});

test("accepts the deprecated fixed-bucket input without changing routing", () => {
  assert.equal(
    createContentAssetBaseUrl({
      ...createInput("https://project.supabase.co"),
      bucket: CONTENT_STORAGE_BUCKET,
    }),
    `https://project.supabase.co/storage/v1/object/public/zerosourcing/content/portfolio/${scope}/`,
  );
});

for (const invalidBucket of ["", "other", " zerosourcing", "zerosourcing "]) {
  test(`rejects the incompatible bucket ${JSON.stringify(invalidBucket)}`, () => {
    assert.throws(
      () =>
        createContentAssetBaseUrl({
          ...createInput("https://project.supabase.co"),
          bucket: invalidBucket,
        }),
      (error) => {
        assert.ok(error instanceof ContentStorageBucketError);
        assert.equal(error.name, "ContentStorageBucketError");
        assert.equal(error.bucket, invalidBucket);
        assert.equal(
          error.message,
          "Content assets must use the zerosourcing Storage bucket.",
        );
        return true;
      },
    );
  });
}

test("builds a canonical object prefix from an uppercase UUID", () => {
  assert.equal(
    contentAssetObjectPrefix(
      "portfolio",
      "A0B1C2D3-E4F5-4678-9ABC-DEF012345678",
    ),
    "content/portfolio/a0b1c2d3-e4f5-4678-9abc-def012345678/",
  );
});

test("shares a non-throwing scope guard and canonicalizing parser", () => {
  const uppercaseScope = "A0B1C2D3-E4F5-4678-9ABC-DEF012345678";

  assert.equal(isContentAssetScope(uppercaseScope), true);
  assert.equal(
    parseContentAssetScope(uppercaseScope),
    "a0b1c2d3-e4f5-4678-9abc-def012345678",
  );
});

for (const invalidScope of [null, undefined, 42, {}, [], true]) {
  test(`the shared scope boundary rejects ${String(invalidScope)}`, () => {
    assert.equal(isContentAssetScope(invalidScope), false);
    assert.throws(
      () => parseContentAssetScope(invalidScope),
      (error) => {
        assert.ok(error instanceof ContentAssetScopeError);
        assert.equal(error.assetScope, invalidScope);
        return true;
      },
    );
  });
}

test("accepts HTTP when the URL has a hostname", () => {
  assert.equal(
    createContentAssetBaseUrl({
      ...createInput("http://localhost:54321/nested?query=1#section"),
      entity: "blog",
    }),
    `http://localhost:54321/storage/v1/object/public/zerosourcing/content/blog/${scope}/`,
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

for (const invalidScope of [
  "",
  "scope",
  "00000000-0000-4000-8000-00000000000",
  "00000000-0000-4000-8000-000000000001/extra",
  "{00000000-0000-4000-8000-000000000001}",
  " 00000000-0000-4000-8000-000000000001",
]) {
  test(`rejects the invalid asset scope ${JSON.stringify(invalidScope)}`, () => {
    assert.throws(
      () => contentAssetObjectPrefix("blog", invalidScope),
      (error) => {
        assert.ok(error instanceof ContentAssetScopeError);
        assert.equal(error.name, "ContentAssetScopeError");
        assert.equal(error.assetScope, invalidScope);
        assert.equal(
          error.message,
          "A valid content asset scope UUID is required.",
        );
        return true;
      },
    );
  });
}

test("rejects an invalid scope before constructing a URL", () => {
  assert.throws(
    () =>
      createContentAssetBaseUrl({
        assetScope: "not-a-uuid",
        entity: "blog",
        supabaseUrl: "https://project.supabase.co",
      }),
    ContentAssetScopeError,
  );
});
