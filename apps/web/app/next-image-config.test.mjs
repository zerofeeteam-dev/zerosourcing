import assert from "node:assert/strict";
import test from "node:test";

import {
  createSupabaseStorageRemotePattern,
  resolveSupabaseStorageRemotePatterns,
  SUPABASE_PUBLIC_STORAGE_PATHNAME,
} from "../lib/public-content/next-image-config.mjs";

test("Supabase images use one exact HTTPS public Storage pattern", () => {
  const pattern = createSupabaseStorageRemotePattern(
    "  https://project.supabase.co/nested?ignored=yes  ",
  );

  assert.ok(pattern instanceof URL);
  assert.equal(pattern.protocol, "https:");
  assert.equal(pattern.hostname, "project.supabase.co");
  assert.equal(pattern.pathname, SUPABASE_PUBLIC_STORAGE_PATHNAME);
  assert.equal(pattern.search, "");
  assert.equal(pattern.hash, "");
  assert.equal(
    pattern.toString(),
    "https://project.supabase.co/storage/v1/object/public/zerosourcing/**",
  );

  const allowedPathPrefix = pattern.pathname.slice(0, -2);
  const canonicalAsset = new URL(
    "/storage/v1/object/public/zerosourcing/content/blog/asset.webp",
    pattern.origin,
  );
  const siblingBucketAsset = new URL(
    "/storage/v1/object/public/sibling/content/blog/asset.webp",
    pattern.origin,
  );
  assert.equal(canonicalAsset.pathname.startsWith(allowedPathPrefix), true);
  assert.equal(
    siblingBucketAsset.pathname.startsWith(allowedPathPrefix),
    false,
  );
});

test("HTTP is limited to literal local loopback authorities", () => {
  for (const url of [
    "http://localhost:54321/nested",
    "http://LOCALHOST:54321",
    "http://127.0.0.1:54321",
    "http://127.42.0.7:54321",
    "http://127.255.255.255:54321",
    "http://[::1]:54321",
  ]) {
    const pattern = createSupabaseStorageRemotePattern(url);
    assert.equal(pattern?.protocol, "http:", url);
    assert.equal(pattern?.pathname, SUPABASE_PUBLIC_STORAGE_PATHNAME, url);
  }
});

test("non-canonical numeric loopback aliases are rejected from raw authority", () => {
  for (const authority of ["2130706433", "0x7f000001", "0177.0.0.1", "127.1"]) {
    assert.throws(
      () => createSupabaseStorageRemotePattern(`http://${authority}:54321`),
      /SUPABASE_URL is invalid/,
      authority,
    );
  }
});

test("remote and deceptive HTTP authorities are rejected", () => {
  for (const url of [
    "http://project.supabase.co",
    "http://192.168.0.1:54321",
    "http://localhost.example.com:54321",
    "http://localhost.:54321",
    "http://127.0.0.1.example.com:54321",
    "http://[::2]:54321",
  ]) {
    assert.throws(
      () => createSupabaseStorageRemotePattern(url),
      /SUPABASE_URL is invalid/,
      url,
    );
  }
});

test("credentials, control characters, backslashes, and unsupported URLs fail closed", () => {
  for (const url of [
    "https://user:secret@project.supabase.co",
    "https://project.supabase.co\u0000.evil.example",
    "https:\\project.supabase.co",
    "ftp://project.supabase.co",
    "not a URL",
  ]) {
    assert.throws(
      () => createSupabaseStorageRemotePattern(url),
      /SUPABASE_URL is invalid/,
      JSON.stringify(url),
    );
  }
});

test("production requires a URL while non-production may omit it", () => {
  assert.deepEqual(
    resolveSupabaseStorageRemotePatterns({
      nodeEnvironment: "development",
      supabaseUrl: undefined,
    }),
    [],
  );
  assert.throws(
    () =>
      resolveSupabaseStorageRemotePatterns({
        nodeEnvironment: "production",
        supabaseUrl: undefined,
      }),
    /SUPABASE_URL must be present at Web build time/,
  );
});
