import assert from "node:assert/strict";
import test from "node:test";
import {
  CONTENT_STORAGE_BUCKET,
  ContentAssetScopeError,
  ContentStorageBucketError,
  contentAssetObjectPrefix,
  createContentAssetBaseUrl,
  isExactPublicStorageObjectUrl,
  isContentAssetScope,
  parseAllowedAssetHttpUrl,
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

test("accepts HTTP for a canonical loopback hostname", () => {
  assert.equal(
    createContentAssetBaseUrl({
      ...createInput("http://localhost:54321/nested?query=1#section"),
      entity: "blog",
    }),
    `http://localhost:54321/storage/v1/object/public/zerosourcing/content/blog/${scope}/`,
  );
});

test("parses HTTPS and canonical literal loopback HTTP asset URLs", () => {
  for (const value of [
    "https://project.supabase.co/path",
    "http://localhost:54321/path",
    "http://127.0.0.1:54321/path",
    "http://127.255.42.7/path",
    "http://[::1]:54321/path",
  ]) {
    assert.equal(parseAllowedAssetHttpUrl(value)?.href, value);
  }
  assert.equal(
    parseAllowedAssetHttpUrl("HTTP://localhost:54321/path")?.href,
    "http://localhost:54321/path",
  );
});

for (const value of [
  "http://project.supabase.co/path",
  "http://127.0.0.1.example/path",
  "http://localhost.example/path",
  "http://127.1/path",
  "http://127.000.000.001/path",
  "http://2130706433/path",
  "http://[0:0:0:0:0:0:0:1]/path",
  "http://LOCALHOST/path",
  "http://localhost:80/path",
  "http://user:secret@127.0.0.1/path",
  "https://user:secret@project.supabase.co/path",
  "https://project.supabase.co\\@evil.example/path",
  "https://project.supabase.co/path with space",
  "https://project.supabase.co/path\nnext",
  "https://project.supabase.co/path\u0085next",
  "https://project.supabase.co/path\u00a0next",
  "https://project.supabase.co/path\u200bnext",
  "https://project.supabase.co/path\u{e0001}next",
  "https://project.supabase.co/path\ud800next",
  "https://project.supabase.co/%0anext",
  "https:////project.supabase.co/path",
  "https://PROJECT.supabase.co/path",
  "https://project.supabase.co:443/path",
  "https://%70roject.supabase.co/path",
  "https://project.supabase.co./path",
  "https://project.supabase.co/storage/./v1",
  "https://project.supabase.co/storage/x/../v1",
  "https://project.supabase.co/storage/%2e/v1",
  "https://project.supabase.co/storage/x/%2e%2e/v1",
]) {
  test(`rejects a non-canonical or unsafe asset URL ${JSON.stringify(value)}`, () => {
    assert.equal(parseAllowedAssetHttpUrl(value), null);
  });
}

test("matches only the canonical fixed-bucket object href", () => {
  const input = {
    objectPath:
      "content/blog/00000000-0000-4000-8000-000000000001/images/card one.png",
    supabaseUrl: "http://127.0.0.1:54321/nested?ignored=1#ignored",
  };
  const canonical =
    "http://127.0.0.1:54321/storage/v1/object/public/zerosourcing/" +
    "content/blog/00000000-0000-4000-8000-000000000001/images/card%20one.png";

  assert.equal(isExactPublicStorageObjectUrl(canonical, input), true);
  for (const value of [
    canonical.replace("127.0.0.1", "127.0.0.2"),
    canonical.replace("127.0.0.1:54321", "127.0.0.1:54322"),
    canonical.replace("content/blog", "content/%62log"),
    canonical.replace("00000000-", "%3000000000-"),
    canonical.replace("card%20one.png", "%63ard%20one.png"),
    `${canonical}?version=2`,
    `${canonical}#preview`,
    canonical.replace("http://", "http://user:secret@"),
    canonical.replace("http://", "HTTP://"),
  ]) {
    assert.equal(isExactPublicStorageObjectUrl(value, input), false, value);
  }
});

test("matches canonical HTTPS without browser-normalized aliases", () => {
  const input = {
    objectPath: "content/blog/scope/images/card.png",
    supabaseUrl: "https://project.supabase.co",
  };
  const canonical =
    "https://project.supabase.co/storage/v1/object/public/zerosourcing/" +
    input.objectPath;
  assert.equal(isExactPublicStorageObjectUrl(canonical, input), true);

  for (const value of [
    canonical.replace("https://", "https:////"),
    canonical.replace("project", "PROJECT"),
    canonical.replace(".co/", ".co:443/"),
    canonical.replace("project", "%70roject"),
    canonical.replace("/storage/v1", "/storage/./v1"),
    canonical.replace("/storage/v1", "/storage/x/../v1"),
    canonical.replace("/storage/v1", "/storage/%2e/v1"),
    canonical.replace("/storage/v1", "/storage/x/%2e%2e/v1"),
  ]) {
    assert.equal(isExactPublicStorageObjectUrl(value, input), false, value);
  }
});

test("rejects remote HTTP even when candidate and configured origins match", () => {
  assert.equal(
    isExactPublicStorageObjectUrl(
      "http://project.supabase.co/storage/v1/object/public/zerosourcing/path/file.png",
      {
        objectPath: "path/file.png",
        supabaseUrl: "http://project.supabase.co",
      },
    ),
    false,
  );
});

test("rejects empty and dot-segment object paths", () => {
  for (const objectPath of ["", "/leading.png", "a//b.png", "a/../b.png"]) {
    assert.equal(
      isExactPublicStorageObjectUrl(
        "https://project.supabase.co/storage/v1/object/public/zerosourcing/a/b.png",
        { objectPath, supabaseUrl: "https://project.supabase.co" },
      ),
      false,
    );
  }
});

test("rejects an invalid Supabase URL", () => {
  assert.throws(() => createContentAssetBaseUrl(createInput("not a URL")), {
    message: "A valid Supabase URL is required.",
  });
});

test("rejects a remote HTTP Supabase URL", () => {
  assert.throws(
    () => createContentAssetBaseUrl(createInput("http://project.supabase.co")),
    { message: "A valid Supabase URL is required." },
  );
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
