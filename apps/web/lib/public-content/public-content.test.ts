import { afterEach, describe, expect, it, vi } from "vitest";
import {
  contentAssetBaseUrlWithConfig,
  parsePublicContentConfig,
  PublicContentConfigError,
} from "./config-core";
import {
  mapBlogCard,
  mapBlogDetail,
  mapPortfolioCard,
  mapPortfolioDetail,
  PublicContentMappingError,
} from "./mappers";
import {
  fetchAllPublicRowsWithConfig,
  fetchPublicRowsWithConfig,
  PUBLIC_CONTENT_MAX_ROWS,
  PublicContentNetworkError,
  PublicContentPageSizeError,
  PublicContentRequestError,
  PublicContentResponseError,
  PublicContentRowLimitError,
} from "./postgrest-core";
import {
  loadPublishedBlogPost,
  loadPublishedBlogPosts,
  loadPublishedPortfolio,
  loadPublishedPortfolios,
  type PublicContentReader,
} from "./queries-core";
import {
  selectBlogIndex,
  selectHomeBlogPosts,
  selectHomePortfolios,
  selectPortfolioIndex,
  selectRelatedBlogPosts,
  selectServicePortfolios,
} from "./selectors";

const assetScope = "A0B1C2D3-E4F5-4678-9ABC-DEF012345678";
const canonicalAssetScope = assetScope.toLowerCase();
const publicContentConfig = {
  publishableKey: "publishable-test-key",
  url: "https://project.supabase.co",
} as const;

function portfolioRow(
  overrides: Readonly<Record<string, unknown>> = {},
): Readonly<Record<string, unknown>> {
  return {
    banner_alt: "포트폴리오 배너 이미지",
    banner_public_url: "https://cdn.example.com/portfolio-banner.png",
    content: "<p>Portfolio</p>",
    content_asset_base_enabled: true,
    content_asset_scope: assetScope,
    content_authoring_mode: "raw_html",
    content_mode: "html",
    core_features: ["검색", "예약"],
    development_period: "3주",
    estimate_label: "298만 원",
    landing_published: true,
    product_description: "설명",
    seo_description: "검색 설명",
    service_published: true,
    slug: "meetit-plus",
    thumbnail_alt: "믿잇 플러스 화면",
    thumbnail_public_url: "https://cdn.example.com/portfolio.png",
    title: "믿잇 플러스",
    type: "application",
    updated_at: "2026-07-14T12:30:45.123456+09:00",
    work_scopes: ["기획", "개발"],
    ...overrides,
  };
}

function blogRow(
  overrides: Readonly<Record<string, unknown>> = {},
): Readonly<Record<string, unknown>> {
  return {
    banner_alt: "블로그 배너 이미지",
    banner_published: true,
    banner_public_url: "https://cdn.example.com/blog-banner.png",
    content: "<p>Blog</p>",
    content_asset_base_enabled: false,
    content_asset_scope: assetScope,
    content_authoring_mode: "wysiwyg",
    content_mode: "html",
    landing_published: true,
    published_at: "2026-07-13T01:02:03Z",
    published_date: "2026-07-12",
    seo_description: "블로그 검색 설명",
    slug: "published-blog",
    summary: "블로그 요약",
    thumbnail_alt: "블로그 대표 이미지",
    thumbnail_public_url: null,
    title: "공개 블로그",
    type: "insight",
    updated_at: "2026-07-14T01:02:03+00:00",
    ...overrides,
  };
}

function jsonResponse(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    headers: { "content-type": "application/json" },
    status,
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("public content configuration", () => {
  it("accepts HTTPS, trims environment values, and exposes no bucket setting", () => {
    expect(
      parsePublicContentConfig({
        SUPABASE_PUBLISHABLE_KEY: "  publishable-key  ",
        SUPABASE_URL: "https://project.supabase.co/nested?ignored=yes",
      }),
    ).toEqual({
      publishableKey: "publishable-key",
      url: "https://project.supabase.co",
    });

    expect(
      parsePublicContentConfig({
        SUPABASE_PUBLISHABLE_KEY: "key",
        SUPABASE_URL: "https://public.example.com:8443",
      }),
    ).toEqual({
      publishableKey: "key",
      url: "https://public.example.com:8443",
    });
  });

  it.each([
    "http://localhost:54321/nested",
    "http://127.0.0.1:54321",
    "http://127.42.0.7:54321",
    "http://127.255.255.255:54321",
    "http://[::1]:54321",
  ])("allows HTTP only for the canonical literal loopback host %s", (url) => {
    const local = parsePublicContentConfig({
      SUPABASE_PUBLISHABLE_KEY: "local-key",
      SUPABASE_URL: url,
    });
    expect(new URL(local.url).protocol).toBe("http:");
    expect(local).not.toHaveProperty("storageBucket");
  });

  it.each([
    "http://project.supabase.co",
    "http://192.168.0.1:54321",
    "http://localhost.example.com:54321",
    "http://127.0.0.1.example.com:54321",
    "http://localhost.:54321",
    "http://LOCALHOST:54321",
    "http://localhost:80",
    "http://127.1:54321",
    "http://127.000.000.001:54321",
    "http://2130706433:54321",
    "http://[::2]:54321",
    "http://[0:0:0:0:0:0:0:1]:54321",
    "http://user:secret@127.0.0.1:54321",
    "https://user:secret@project.supabase.co",
    "https:////project.supabase.co/path",
    "https://PROJECT.supabase.co/path",
    "https://project.supabase.co:443/path",
    "https://%70roject.supabase.co/path",
    "https://project.supabase.co/storage/./v1",
    "https://project.supabase.co/x/../storage/v1",
    "https://project.supabase.co/storage/%2e/v1",
    "https://project.supabase.co/storage/%2e%2e/v1",
    "https://project.supabase.co\\@evil.example/path",
    "https://project.supabase.co/path\nnext",
    "https://project.supabase.co/path\u0085next",
    "https://project.supabase.co/path\u00a0next",
    "https://project.supabase.co/path\u200bnext",
    "https://project.supabase.co/%0anext",
  ])("rejects an unsafe or noncanonical asset transport URL at %s", (url) => {
    expect(() =>
      parsePublicContentConfig({
        SUPABASE_PUBLISHABLE_KEY: "key",
        SUPABASE_URL: url,
      }),
    ).toThrow(PublicContentConfigError);
  });

  it.each([
    ["missing URL", { SUPABASE_PUBLISHABLE_KEY: "key" }],
    ["missing key", { SUPABASE_URL: "https://project.supabase.co" }],
    [
      "blank key",
      {
        SUPABASE_PUBLISHABLE_KEY: "   ",
        SUPABASE_URL: "https://project.supabase.co",
      },
    ],
    [
      "unsupported protocol",
      {
        SUPABASE_PUBLISHABLE_KEY: "key",
        SUPABASE_URL: "ftp://project.supabase.co",
      },
    ],
    [
      "missing hostname",
      { SUPABASE_PUBLISHABLE_KEY: "key", SUPABASE_URL: "file:///tmp/db" },
    ],
  ])("rejects %s", (_label, environment) => {
    expect(() => parsePublicContentConfig(environment)).toThrow(
      PublicContentConfigError,
    );
  });

  it("builds the fixed zerosourcing asset base through the shared helper", () => {
    expect(
      contentAssetBaseUrlWithConfig(
        publicContentConfig,
        "portfolio",
        assetScope,
      ),
    ).toBe(
      `https://project.supabase.co/storage/v1/object/public/zerosourcing/content/portfolio/${canonicalAssetScope}/`,
    );

    expect(
      contentAssetBaseUrlWithConfig(
        {
          publishableKey: "local-key",
          url: "http://[::1]:54321",
        },
        "blog",
        assetScope,
      ),
    ).toBe(
      `http://[::1]:54321/storage/v1/object/public/zerosourcing/content/blog/${canonicalAssetScope}/`,
    );

    expect(() =>
      contentAssetBaseUrlWithConfig(
        {
          publishableKey: "key",
          url: "http://project.supabase.co",
        },
        "portfolio",
        assetScope,
      ),
    ).toThrow(PublicContentConfigError);
  });
});

describe("PostgREST public reader", () => {
  it("uses only the publishable apikey header and no-store", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([{ slug: "ok" }]));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      fetchPublicRowsWithConfig({
        config: publicContentConfig,
        query: { select: "slug,title", status: "eq.published" },
        table: "portfolios",
      }),
    ).resolves.toEqual([{ slug: "ok" }]);

    const [request, init] = fetchMock.mock.calls[0] ?? [];
    expect(String(request)).toBe(
      "https://project.supabase.co/rest/v1/portfolios?select=slug%2Ctitle&status=eq.published",
    );
    expect(init).toMatchObject({
      cache: "no-store",
      headers: { apikey: "publishable-test-key" },
    });
    expect(init?.headers).not.toHaveProperty("Authorization");
    expect(init?.headers).not.toHaveProperty("authorization");
  });

  it("fails loudly with typed request, response, and network errors", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    fetchMock.mockResolvedValueOnce(jsonResponse({ message: "denied" }, 403));
    await expect(
      fetchPublicRowsWithConfig({
        config: publicContentConfig,
        query: { select: "slug" },
        table: "blog_posts",
      }),
    ).rejects.toMatchObject({
      name: "PublicContentRequestError",
      status: 403,
      table: "blog_posts",
    } satisfies Partial<PublicContentRequestError>);

    fetchMock.mockResolvedValueOnce(new Response("{not-json", { status: 200 }));
    await expect(
      fetchPublicRowsWithConfig({
        config: publicContentConfig,
        query: { select: "slug" },
        table: "portfolios",
      }),
    ).rejects.toBeInstanceOf(PublicContentResponseError);

    fetchMock.mockResolvedValueOnce(jsonResponse({ slug: "not-an-array" }));
    await expect(
      fetchPublicRowsWithConfig({
        config: publicContentConfig,
        query: { select: "slug" },
        table: "portfolios",
      }),
    ).rejects.toMatchObject({ failure: "non-array" });

    fetchMock.mockRejectedValueOnce(new TypeError("offline"));
    await expect(
      fetchPublicRowsWithConfig({
        config: publicContentConfig,
        query: { select: "slug" },
        table: "portfolios",
      }),
    ).rejects.toBeInstanceOf(PublicContentNetworkError);
  });

  it("paginates past the first 1,000 rows with stable query parameters", async () => {
    const firstPage = Array.from({ length: 1_000 }, (_, id) => ({ id }));
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(firstPage))
      .mockResolvedValueOnce(jsonResponse([{ id: 1_000 }]));
    vi.stubGlobal("fetch", fetchMock);

    const rows = await fetchAllPublicRowsWithConfig({
      config: publicContentConfig,
      query: {
        deleted_at: "is.null",
        order: "published_at.desc,created_at.desc,slug.asc",
        select: "slug,title",
        status: "eq.published",
      },
      table: "blog_posts",
    });

    expect(rows).toHaveLength(1_001);
    const firstUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
    const secondUrl = new URL(String(fetchMock.mock.calls[1]?.[0]));
    expect(firstUrl.searchParams.get("offset")).toBe("0");
    expect(secondUrl.searchParams.get("offset")).toBe("1000");
    expect(secondUrl.searchParams.get("limit")).toBe("1000");
    expect(secondUrl.searchParams.get("order")).toBe(
      "published_at.desc,created_at.desc,slug.asc",
    );
  });

  it("stops at 100 pages without requesting an unbounded 100,001st row", async () => {
    const fullPageJson = JSON.stringify(
      Array.from({ length: 1_000 }, (_, index) => index),
    );
    const fetchMock = vi.fn().mockImplementation(
      async () =>
        new Response(fullPageJson, {
          headers: { "content-type": "application/json" },
          status: 200,
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      fetchAllPublicRowsWithConfig({
        config: publicContentConfig,
        query: { select: "slug" },
        table: "portfolios",
      }),
    ).rejects.toMatchObject({
      maximumRows: PUBLIC_CONTENT_MAX_ROWS,
      name: "PublicContentRowLimitError",
    } satisfies Partial<PublicContentRowLimitError>);

    expect(fetchMock).toHaveBeenCalledTimes(100);
    const lastUrl = new URL(String(fetchMock.mock.calls.at(-1)?.[0]));
    expect(lastUrl.searchParams.get("offset")).toBe("99000");
    expect(
      fetchMock.mock.calls.some(([url]) =>
        String(url).includes("offset=100000"),
      ),
    ).toBe(false);
  });

  it("rejects a server page that violates the 1,000-row contract", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(Array.from({ length: 1_001 })));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      fetchAllPublicRowsWithConfig({
        config: publicContentConfig,
        query: { select: "slug" },
        table: "blog_posts",
      }),
    ).rejects.toBeInstanceOf(PublicContentPageSizeError);
  });
});

describe("public row mapping", () => {
  it("maps portfolio and blog rows to serializable camel-case models", () => {
    expect(mapPortfolioCard(portfolioRow())).toEqual({
      category: "어플리케이션",
      description: "설명",
      duration: "3주",
      estimate: "298만 원",
      features: ["검색", "예약"],
      landingPublished: true,
      scope: ["기획", "개발"],
      servicePublished: true,
      slug: "meetit-plus",
      thumbnailAlt: "믿잇 플러스 화면",
      thumbnailUrl: "https://cdn.example.com/portfolio.png",
      title: "믿잇 플러스",
      type: "application",
      updatedAt: "2026-07-14T12:30:45.123456+09:00",
    });

    expect(mapPortfolioDetail(portfolioRow())).toMatchObject({
      assetBaseEnabled: true,
      assetScope: canonicalAssetScope,
      bannerAlt: "포트폴리오 배너 이미지",
      bannerUrl: "https://cdn.example.com/portfolio-banner.png",
      content: "<p>Portfolio</p>",
      contentAuthoringMode: "raw_html",
      contentMode: "html",
      seoDescription: "검색 설명",
    });

    expect(mapBlogDetail(blogRow())).toMatchObject({
      assetBaseEnabled: false,
      assetScope: canonicalAssetScope,
      author: "제로소싱",
      bannerAlt: "블로그 배너 이미지",
      bannerUrl: "https://cdn.example.com/blog-banner.png",
      category: "인사이트",
      contentAuthoringMode: "wysiwyg",
      date: "2026. 07. 12",
      thumbnailUrl: null,
    });
  });

  it("uses published_at only when published_date is null", () => {
    expect(mapBlogCard(blogRow({ published_date: null })).date).toBe(
      "2026. 07. 13",
    );
    expect(() =>
      mapBlogCard(blogRow({ published_at: "2026-02-30T01:00:00Z" })),
    ).toThrow(PublicContentMappingError);
  });

  it("fails closed for every row boundary type and semantic contract", () => {
    expect(() => mapPortfolioCard(null)).toThrow(PublicContentMappingError);

    const invalidPortfolioRows = [
      portfolioRow({ title: null }),
      portfolioRow({ thumbnail_public_url: false }),
      portfolioRow({ landing_published: "true" }),
      portfolioRow({ core_features: ["valid", 1] }),
      portfolioRow({ core_features: new Array(1) }),
      portfolioRow({ type: "website" }),
      portfolioRow({ slug: "Invalid-Slug" }),
      portfolioRow({ updated_at: "yesterday" }),
      portfolioRow({ updated_at: "2026-02-30T01:00:00Z" }),
    ];
    for (const row of invalidPortfolioRows) {
      expect(() => mapPortfolioCard(row)).toThrow(PublicContentMappingError);
    }

    const invalidPortfolioDetails = [
      portfolioRow({ content_asset_scope: "not-a-uuid" }),
      portfolioRow({ content_authoring_mode: "html" }),
      portfolioRow({ content_mode: "markdown" }),
      portfolioRow({ content_asset_base_enabled: 1 }),
      portfolioRow({ banner_public_url: false }),
    ];
    for (const row of invalidPortfolioDetails) {
      expect(() => mapPortfolioDetail(row)).toThrow(PublicContentMappingError);
    }

    expect(() =>
      mapBlogCard(blogRow({ published_date: "2026-02-30" })),
    ).toThrow(PublicContentMappingError);
  });
});

describe("public query contracts", () => {
  it("uses the exact public filters, columns, and stable list order", async () => {
    const reader: PublicContentReader = {
      fetchAll: vi
        .fn()
        .mockResolvedValueOnce([portfolioRow()])
        .mockResolvedValueOnce([blogRow()]),
      fetchPage: vi.fn(),
    };

    await expect(loadPublishedPortfolios(reader)).resolves.toHaveLength(1);
    await expect(loadPublishedBlogPosts(reader)).resolves.toHaveLength(1);

    expect(reader.fetchAll).toHaveBeenNthCalledWith(1, {
      table: "portfolios",
      query: {
        deleted_at: "is.null",
        order: "published_at.desc,created_at.desc,slug.asc",
        select:
          "slug,title,type,product_description,estimate_label,development_period,core_features,work_scopes,thumbnail_public_url,thumbnail_alt,landing_published,service_published,updated_at",
        status: "eq.published",
      },
    });
    expect(reader.fetchAll).toHaveBeenNthCalledWith(2, {
      table: "blog_posts",
      query: {
        deleted_at: "is.null",
        order: "published_at.desc,created_at.desc,slug.asc",
        select:
          "slug,title,type,summary,published_date,thumbnail_public_url,thumbnail_alt,banner_public_url,banner_alt,landing_published,banner_published,published_at,updated_at",
        status: "eq.published",
      },
    });
  });

  it("guards an invalid detail slug before any network reader is called", async () => {
    const reader: PublicContentReader = {
      fetchAll: vi.fn(),
      fetchPage: vi.fn(),
    };

    for (const slug of ["", "UPPERCASE", "../draft", "with space", "a.b"]) {
      await expect(loadPublishedPortfolio(reader, slug)).resolves.toBeNull();
      await expect(loadPublishedBlogPost(reader, slug)).resolves.toBeNull();
    }
    expect(reader.fetchPage).not.toHaveBeenCalled();
  });

  it("queries one valid detail with only its public columns", async () => {
    const reader: PublicContentReader = {
      fetchAll: vi.fn(),
      fetchPage: vi
        .fn()
        .mockResolvedValueOnce([portfolioRow()])
        .mockResolvedValueOnce([blogRow()]),
    };

    await expect(
      loadPublishedPortfolio(reader, "meetit-plus"),
    ).resolves.toMatchObject({ slug: "meetit-plus" });
    await expect(
      loadPublishedBlogPost(reader, "published-blog"),
    ).resolves.toMatchObject({ slug: "published-blog" });

    expect(reader.fetchPage).toHaveBeenNthCalledWith(1, {
      table: "portfolios",
      query: {
        deleted_at: "is.null",
        limit: "1",
        select:
          "slug,title,type,product_description,estimate_label,development_period,core_features,work_scopes,thumbnail_public_url,thumbnail_alt,landing_published,service_published,updated_at,banner_public_url,banner_alt,content_mode,content_authoring_mode,content,content_asset_scope,content_asset_base_enabled,seo_description",
        slug: "eq.meetit-plus",
        status: "eq.published",
      },
    });
    expect(reader.fetchPage).toHaveBeenNthCalledWith(2, {
      table: "blog_posts",
      query: {
        deleted_at: "is.null",
        limit: "1",
        select:
          "slug,title,type,summary,published_date,thumbnail_public_url,thumbnail_alt,banner_public_url,banner_alt,landing_published,banner_published,published_at,updated_at,content_mode,content_authoring_mode,content,content_asset_scope,content_asset_base_enabled,seo_description",
        slug: "eq.published-blog",
        status: "eq.published",
      },
    });
  });
});

describe("public selectors", () => {
  it("preserves source order while enforcing home limits", () => {
    const portfolioRows = Array.from({ length: 9 }, (_, index) => ({
      landingPublished: index !== 1,
      slug: `portfolio-${index}`,
    }));
    const blogRows = Array.from({ length: 6 }, (_, index) => ({
      landingPublished: index % 2 === 0,
      slug: `blog-${index}`,
    }));

    expect(selectHomePortfolios(portfolioRows).map((row) => row.slug)).toEqual([
      "portfolio-0",
      "portfolio-2",
      "portfolio-3",
      "portfolio-4",
      "portfolio-5",
      "portfolio-6",
    ]);
    expect(selectHomeBlogPosts(blogRows).map((row) => row.slug)).toEqual([
      "blog-0",
      "blog-2",
      "blog-4",
    ]);
  });

  it("uses flags first and falls back deterministically for index features", () => {
    const portfolios = [
      { landingPublished: false, slug: "newest" },
      { landingPublished: true, slug: "landing" },
      { landingPublished: false, slug: "older" },
    ];
    const blogs = [
      { bannerPublished: false, slug: "newest" },
      { bannerPublished: true, slug: "banner" },
      { bannerPublished: false, slug: "older" },
      { bannerPublished: false, slug: "oldest" },
    ];

    expect(selectPortfolioIndex(portfolios)).toEqual({
      featured: portfolios[1],
      list: [portfolios[0], portfolios[2]],
    });
    expect(selectBlogIndex(blogs)).toEqual({
      featured: blogs[1],
      list: [blogs[0], blogs[2], blogs[3]],
      top: [blogs[0], blogs[2], blogs[3]],
    });
    expect(
      selectPortfolioIndex([{ landingPublished: false, slug: "fallback" }])
        .featured?.slug,
    ).toBe("fallback");
    expect(selectBlogIndex([])).toEqual({ featured: null, list: [], top: [] });
  });

  it("limits service and related results to three in source order", () => {
    const portfolios = Array.from({ length: 6 }, (_, index) => ({
      servicePublished: index !== 1,
      slug: `portfolio-${index}`,
      type: index === 5 ? ("mvp" as const) : ("application" as const),
    }));
    expect(
      selectServicePortfolios(portfolios, "application").map((row) => row.slug),
    ).toEqual(["portfolio-0", "portfolio-2", "portfolio-3"]);

    const blogs = Array.from({ length: 7 }, (_, index) => ({
      slug: `blog-${index}`,
      type: index === 6 ? ("mvp" as const) : ("insight" as const),
    }));
    expect(
      selectRelatedBlogPosts(blogs, "insight", "blog-1").map((row) => row.slug),
    ).toEqual(["blog-0", "blog-2", "blog-3"]);
  });
});
