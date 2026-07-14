import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  compareCutoverInventory,
  CutoverConfigError,
  CutoverManifestError,
  CutoverShapeError,
  fetchPublishedInventory,
  parseSupabaseOrigin,
  parseVerificationConfig,
  runCli,
  validateCutoverManifest,
} from "./verify-public-content-cutover.mjs";

const manifest = JSON.parse(
  await readFile(
    new URL("./public-content-cutover-manifest.json", import.meta.url),
    "utf8",
  ),
);

function responsesFromManifest(value = manifest) {
  return {
    blogPosts: value.blogPosts.map((row) => ({
      banner_published: row.bannerPublished,
      landing_published: row.landingPublished,
      slug: row.slug,
    })),
    portfolios: value.portfolios.map((row) => ({
      landing_published: row.landingPublished,
      service_published: row.servicePublished,
      slug: row.slug,
      type: row.type,
    })),
  };
}

function response(payload, ok = true) {
  return {
    json: async () => payload,
    ok,
  };
}

test("locks the complete pre-cutover fixture inventory and exposure flags", () => {
  assert.deepEqual(manifest, {
    portfolios: [
      {
        slug: "classit",
        type: "company_homepage",
        landingPublished: true,
        servicePublished: false,
      },
      {
        slug: "todomall",
        type: "mvp",
        landingPublished: true,
        servicePublished: true,
      },
      {
        slug: "gongsa-morakmorak",
        type: "mvp",
        landingPublished: true,
        servicePublished: true,
      },
      {
        slug: "meetit-plus",
        type: "mvp",
        landingPublished: true,
        servicePublished: true,
      },
      {
        slug: "jangryedam",
        type: "company_homepage",
        landingPublished: true,
        servicePublished: false,
      },
      {
        slug: "lipang",
        type: "application",
        landingPublished: true,
        servicePublished: false,
      },
      {
        slug: "opus-house",
        type: "company_homepage",
        landingPublished: false,
        servicePublished: false,
      },
      {
        slug: "my-plan-it",
        type: "mvp",
        landingPublished: false,
        servicePublished: false,
      },
      {
        slug: "relive-deal",
        type: "application",
        landingPublished: false,
        servicePublished: false,
      },
    ],
    blogPosts: [
      {
        slug: "mvp-development-cost",
        landingPublished: false,
        bannerPublished: false,
      },
      {
        slug: "hybrid-vs-native-app",
        landingPublished: true,
        bannerPublished: true,
      },
      {
        slug: "mvp-with-government-support",
        landingPublished: false,
        bannerPublished: false,
      },
      {
        slug: "outsourcing-fail-patterns",
        landingPublished: false,
        bannerPublished: false,
      },
      {
        slug: "company-homepage-search",
        landingPublished: true,
        bannerPublished: false,
      },
      {
        slug: "nocode-vs-custom-development",
        landingPublished: true,
        bannerPublished: false,
      },
    ],
  });
  assert.deepEqual(validateCutoverManifest(manifest), manifest);
});

test("accepts HTTPS and only canonical local HTTP origins", () => {
  for (const value of [
    "https://project.supabase.co",
    "http://localhost:54321",
    "http://127.0.0.1:54321",
    "http://127.20.30.40:54321",
    "http://[::1]:54321",
  ]) {
    assert.equal(parseSupabaseOrigin(value), new URL(value).origin);
  }

  for (const value of [
    "http://project.supabase.co",
    "http://127.1:54321",
    "http://0177.0.0.1:54321",
    "http://127.0.0.1.example:54321",
    "http://user:secret@127.0.0.1:54321",
    "http://LOCALHOST:54321",
    "http:////127.0.0.1:54321",
    "http://127.0.0.1:54321/a/../b",
    "https:////project.supabase.co",
    "https://%70roject.supabase.co",
    "https://project.supabase.co/storage/%2e/v1",
    "https://PROJECT.supabase.co",
    "https://project.supabase.co:443",
    " https://project.supabase.co",
  ]) {
    assert.equal(parseSupabaseOrigin(value), null, value);
  }
});

test("requires both verifier environment values without normalizing secrets", () => {
  assert.deepEqual(
    parseVerificationConfig({
      SUPABASE_PUBLISHABLE_KEY: "publishable-key",
      SUPABASE_URL: "http://127.0.0.1:54321",
    }),
    {
      publishableKey: "publishable-key",
      url: "http://127.0.0.1:54321",
    },
  );

  for (const environment of [
    {},
    { SUPABASE_URL: "https://project.supabase.co" },
    {
      SUPABASE_PUBLISHABLE_KEY: "key",
      SUPABASE_URL: "http://project.supabase.co",
    },
    {
      SUPABASE_PUBLISHABLE_KEY: " key",
      SUPABASE_URL: "https://project.supabase.co",
    },
  ]) {
    assert.throws(
      () => parseVerificationConfig(environment),
      CutoverConfigError,
    );
  }
});

test("reports no issues for an exact inventory match", () => {
  assert.deepEqual(
    compareCutoverInventory(manifest, responsesFromManifest()),
    [],
  );
});

test("reports missing and extra slugs without row data", () => {
  const responses = responsesFromManifest();
  responses.portfolios = responses.portfolios.filter(
    (row) => row.slug !== "classit",
  );
  responses.blogPosts.push({
    banner_published: false,
    landing_published: false,
    slug: "extra-post",
  });

  assert.deepEqual(compareCutoverInventory(manifest, responses), [
    { kind: "extra", section: "blog", slug: "extra-post" },
    { kind: "missing", section: "portfolio", slug: "classit" },
  ]);
});

test("reports each slug once when exposure flags or service type mismatch", () => {
  const responses = responsesFromManifest();
  const meetitPlus = responses.portfolios.find(
    (row) => row.slug === "meetit-plus",
  );
  meetitPlus.landing_published = false;
  meetitPlus.service_published = false;
  meetitPlus.type = "application";

  const hybridVsNative = responses.blogPosts.find(
    (row) => row.slug === "hybrid-vs-native-app",
  );
  hybridVsNative.banner_published = false;

  assert.deepEqual(compareCutoverInventory(manifest, responses), [
    {
      kind: "mismatched",
      section: "blog",
      slug: "hybrid-vs-native-app",
    },
    { kind: "mismatched", section: "portfolio", slug: "meetit-plus" },
  ]);
});

test("rejects malformed manifests and PostgREST responses", () => {
  assert.throws(
    () => validateCutoverManifest({ blogPosts: [], portfolios: [] }),
    CutoverManifestError,
  );

  const malformedResponses = [
    { blogPosts: {}, portfolios: [] },
    { blogPosts: [], portfolios: {} },
    { blogPosts: [], portfolios: [], rawContent: "must-not-be-read" },
    {
      ...responsesFromManifest(),
      blogPosts: [
        {
          banner_published: false,
          landing_published: "false",
          slug: "bad-boolean",
        },
      ],
    },
    {
      ...responsesFromManifest(),
      portfolios: [
        {
          content: "must-not-be-read",
          landing_published: false,
          service_published: false,
          slug: "unexpected-content",
          type: "mvp",
        },
      ],
    },
    {
      ...responsesFromManifest(),
      blogPosts: [
        {
          banner_published: false,
          landing_published: false,
          slug: "unsafe\nslug",
        },
      ],
    },
    {
      ...responsesFromManifest(),
      portfolios: [
        responsesFromManifest().portfolios[0],
        responsesFromManifest().portfolios[0],
      ],
    },
  ];

  for (const responses of malformedResponses) {
    assert.throws(
      () => compareCutoverInventory(manifest, responses),
      CutoverShapeError,
    );
  }
});

test("queries only required public columns with published nondeleted filters", async () => {
  const calls = [];
  const config = {
    publishableKey: "publishable-key",
    url: "https://project.supabase.co",
  };

  await fetchPublishedInventory(config, async (url, options) => {
    calls.push({ options, url });
    return response([]);
  });

  assert.equal(calls.length, 2);
  const byTable = new Map(
    calls.map((call) => [new URL(call.url).pathname.split("/").at(-1), call]),
  );
  const expectedSelects = {
    blog_posts: "slug,landing_published,banner_published",
    portfolios: "slug,type,landing_published,service_published",
  };

  for (const [table, select] of Object.entries(expectedSelects)) {
    const call = byTable.get(table);
    const url = new URL(call.url);
    assert.equal(url.searchParams.get("select"), select);
    assert.equal(url.searchParams.get("status"), "eq.published");
    assert.equal(url.searchParams.get("deleted_at"), "is.null");
    assert.equal(url.searchParams.get("order"), "slug.asc");
    assert.equal(url.searchParams.get("limit"), "1000");
    assert.equal(url.searchParams.get("offset"), "0");
    assert.deepEqual(call.options, {
      cache: "no-store",
      headers: { apikey: "publishable-key" },
      redirect: "error",
    });
    assert.equal(url.searchParams.has("content"), false);
  }
});

test("CLI failures never disclose keys, response rows, or nested errors", async () => {
  const secret = "never-print-this-key";

  for (const scenario of [
    {
      environment: {
        SUPABASE_PUBLISHABLE_KEY: secret,
        SUPABASE_URL: "http://public.example",
      },
      fetchImplementation: async () => response([]),
      expected: "configuration error",
    },
    {
      environment: {
        SUPABASE_PUBLISHABLE_KEY: secret,
        SUPABASE_URL: "https://project.supabase.co",
      },
      fetchImplementation: async () => {
        throw new Error(`${secret} raw network failure`);
      },
      expected: "network error",
    },
    {
      environment: {
        SUPABASE_PUBLISHABLE_KEY: secret,
        SUPABASE_URL: "https://project.supabase.co",
      },
      fetchImplementation: async () =>
        response([
          {
            content: `${secret} raw content`,
            landing_published: true,
            slug: "unsafe-extra-field",
          },
        ]),
      expected: "response shape error",
    },
  ]) {
    const output = [];
    const exitCode = await runCli({
      environment: scenario.environment,
      fetchImplementation: scenario.fetchImplementation,
      writeFailure: (message) => output.push(message),
    });

    assert.equal(exitCode, 1);
    assert.deepEqual(output, [scenario.expected]);
    assert.equal(output.join("\n").includes(secret), false);
    assert.equal(output.join("\n").includes("raw"), false);
  }
});

test("CLI mismatch output contains only the affected slug and safe labels", async () => {
  const responses = responsesFromManifest();
  const meetitPlus = responses.portfolios.find(
    (row) => row.slug === "meetit-plus",
  );
  meetitPlus.service_published = false;
  const output = [];

  const exitCode = await runCli({
    environment: {
      SUPABASE_PUBLISHABLE_KEY: "publishable-key",
      SUPABASE_URL: "https://project.supabase.co",
    },
    fetchImplementation: async (url) =>
      response(
        new URL(url).pathname.endsWith("/portfolios")
          ? responses.portfolios
          : responses.blogPosts,
      ),
    writeFailure: (message) => output.push(message),
  });

  assert.equal(exitCode, 1);
  assert.deepEqual(output, ["portfolio mismatched: meetit-plus"]);
  assert.equal(output[0].includes("false"), false);
});

test("CLI exits successfully and stays silent for an exact match", async () => {
  const responses = responsesFromManifest();
  const output = [];

  const exitCode = await runCli({
    environment: {
      SUPABASE_PUBLISHABLE_KEY: "publishable-key",
      SUPABASE_URL: "http://127.0.0.1:54321",
    },
    fetchImplementation: async (url) =>
      response(
        new URL(url).pathname.endsWith("/portfolios")
          ? responses.portfolios
          : responses.blogPosts,
      ),
    writeFailure: (message) => output.push(message),
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(output, []);
});
