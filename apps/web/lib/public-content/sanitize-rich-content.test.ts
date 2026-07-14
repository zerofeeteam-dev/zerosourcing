import { describe, expect, it } from "vitest";
import {
  isOwnedContentImageSource,
  sanitizeRichContent,
} from "./sanitize-rich-content";

const scope = "a0b1c2d3-e4f5-4678-9abc-def012345678";
const allowedImageBaseUrl = `https://project.supabase.co/storage/v1/object/public/zerosourcing/content/blog/${scope}/`;
const ownedImageUrl = `${allowedImageBaseUrl}images/01234567-89ab-4cde-8f01-23456789abcd.webp`;

describe("sanitizeRichContent", () => {
  it("preserves the complete editor markup contract and is idempotent", () => {
    const source = [
      '<h2 style="text-align:center">H2</h2>',
      '<h3 style="text-align:right">H3</h3>',
      '<h4 style="text-align:left">H4</h4>',
      '<p style="text-align:center"><strong>굵게</strong><em>기울임</em><u>밑줄</u><s>취소</s><br>다음 줄</p>',
      "<ul><li>순서 없음</li></ul>",
      "<ol><li>순서 있음</li></ol>",
      "<blockquote>인용</blockquote>",
      "<pre><code>const safe = true;</code></pre>",
      '<a href="http://example.com/path">HTTP</a>',
      '<a href="https://example.com/path?one=1&amp;two=2">HTTPS</a>',
      '<a href="mailto:hello@example.com">메일</a>',
      '<a href="tel:+82-10-1234-5678">전화</a>',
      "<hr>",
      `<img src="${ownedImageUrl}" alt="기능 화면" title="이미지 제목" width="960" height="540" loading="eager">`,
    ].join("");

    const clean = sanitizeRichContent(source, { allowedImageBaseUrl });

    for (const fragment of [
      '<h2 style="text-align:center">H2</h2>',
      '<h3 style="text-align:right">H3</h3>',
      '<h4 style="text-align:left">H4</h4>',
      "<strong>굵게</strong>",
      "<em>기울임</em>",
      "<u>밑줄</u>",
      "<s>취소</s>",
      "<br />",
      "<ul><li>순서 없음</li></ul>",
      "<ol><li>순서 있음</li></ol>",
      "<blockquote>인용</blockquote>",
      "<pre><code>const safe = true;</code></pre>",
      "<hr />",
      `src="${ownedImageUrl}"`,
      'alt="기능 화면"',
      'title="이미지 제목"',
      'width="960"',
      'height="540"',
      'loading="lazy"',
    ]) {
      expect(clean).toContain(fragment);
    }
    expect(clean.match(/target="_blank"/g)).toHaveLength(4);
    expect(clean.match(/rel="noopener noreferrer"/g)).toHaveLength(4);
    expect(clean).toContain('href="http://example.com/path"');
    expect(clean).toContain('href="https://example.com/path?one=1&amp;two=2"');
    expect(clean).toContain('href="mailto:hello@example.com"');
    expect(clean).toContain('href="tel:+82-10-1234-5678"');
    expect(sanitizeRichContent(clean, { allowedImageBaseUrl })).toBe(clean);
  });

  it("keeps only alignments emitted by the configured editor", () => {
    const clean = sanitizeRichContent(
      '<p style="text-align:left">왼쪽</p>' +
        '<p style="text-align:center">가운데</p>' +
        '<p style="text-align:right">오른쪽</p>' +
        '<p style="text-align:justify">양쪽</p>' +
        '<h2 style="text-align:center">제목</h2>' +
        '<blockquote style="text-align:center">인용</blockquote>',
      { allowedImageBaseUrl },
    );

    expect(clean).toContain('<p style="text-align:left">왼쪽</p>');
    expect(clean).toContain('<p style="text-align:center">가운데</p>');
    expect(clean).toContain('<p style="text-align:right">오른쪽</p>');
    expect(clean).toContain("<p>양쪽</p>");
    expect(clean).toContain('<h2 style="text-align:center">제목</h2>');
    expect(clean).toContain("<blockquote>인용</blockquote>");
  });

  it("removes executable markup, unsafe CSS, and smuggled links", () => {
    const source = [
      '<h2 onclick="alert(1)" style="text-align:center;background:url(javascript:alert(1))">제목</h2>',
      '<p style="text-align:expression(alert(1))">본문</p>',
      '<a href="javascript:alert(1)" target="safe">javascript</a>',
      '<a href="java&#x0A;script:alert(1)">entity control</a>',
      '<a href="https%3A%2F%2Fevil.example">encoded scheme</a>',
      '<a href="https://example.com/%250aevil">nested control</a>',
      '<a href="https:\\evil.example">backslash</a>',
      "<script>alert(1)</script>",
      "<style>body{background:url(javascript:alert(1))}</style>",
      '<iframe src="https://evil.example">frame</iframe>',
      '<object data="https://evil.example">object</object>',
      '<form action="https://evil.example"><input name="secret"></form>',
      '<svg><script>alert(1)</script><circle onload="alert(1)"></circle></svg>',
      "<math><mtext><img src=x onerror=alert(1)></mtext></math>",
    ].join("");

    const clean = sanitizeRichContent(source, { allowedImageBaseUrl });

    expect(clean).toContain('<h2 style="text-align:center">제목</h2>');
    expect(clean).toContain("<p>본문</p>");
    expect(clean).not.toMatch(
      /onclick|onerror|onload|javascript:|expression|background|target="safe"/i,
    );
    expect(clean).not.toMatch(
      /<\/?(?:script|style|iframe|object|form|input|svg|circle|math|mtext)\b/i,
    );
    expect(clean).not.toContain("https%3A");
    expect(clean).not.toContain("%250a");
    expect(clean).not.toContain("evil.example");
  });

  it("drops every image outside the exact record scope", () => {
    const invalidSources = [
      "data:image/png;base64,AAAA",
      "blob:https://project.supabase.co/id",
      "mailto:hello@example.com",
      "tel:+821012345678",
      "//project.supabase.co/image.webp",
      "https://external.example/image.webp",
      `https://project.supabase.co/storage/v1/object/public/zerosourcing/content/blog/${scope.slice(0, -1)}9/images/a.webp`,
      `https://project.supabase.co/storage/v1/object/public/zerosourcing/content/blog/${scope}9/images/a.webp`,
      `${allowedImageBaseUrl}%2e%2e/other-scope/images/a.webp`,
      `${allowedImageBaseUrl}%252e%252e%252fother-scope/images/a.webp`,
      `${allowedImageBaseUrl}images%2f..%2f..%2fother-scope/a.webp`,
      `${allowedImageBaseUrl}images/%5c..%5cother-scope/a.webp`,
      `${allowedImageBaseUrl}images/a.webp%0d%0aevil`,
      `${allowedImageBaseUrl}images/a.webp?redirect=https://evil.example`,
      `${allowedImageBaseUrl}images/a.webp#fragment`,
      `https://user@project.supabase.co${new URL(ownedImageUrl).pathname}`,
      `http://project.supabase.co${new URL(ownedImageUrl).pathname}`,
    ];
    const source = [
      `<img src="${ownedImageUrl}" alt="kept">`,
      ...invalidSources.map(
        (imageSource, index) =>
          `<img src="${imageSource}" alt="invalid-${index}">`,
      ),
    ].join("");

    const clean = sanitizeRichContent(source, { allowedImageBaseUrl });

    expect(clean.match(/<img\b/g)).toHaveLength(1);
    expect(clean).toContain('alt="kept"');
    expect(clean).not.toContain("invalid-");
  });

  it("preserves decorative alt text semantics and forces lazy loading", () => {
    const clean = sanitizeRichContent(
      `<img src="${ownedImageUrl}" alt="" loading="eager">`,
      { allowedImageBaseUrl },
    );

    expect(clean).toContain('alt=""');
    expect(clean).toContain('loading="lazy"');
    expect(clean).not.toContain('loading="eager"');
  });

  it("keeps local loopback assets but fails closed for a public HTTP base", () => {
    const localBase = `http://127.25.10.4:54321/storage/v1/object/public/zerosourcing/content/blog/${scope}/`;
    const publicBase = `http://project.supabase.co/storage/v1/object/public/zerosourcing/content/blog/${scope}/`;

    expect(
      sanitizeRichContent(
        `<img src="${localBase}images/local.webp" alt="local">`,
        { allowedImageBaseUrl: localBase },
      ),
    ).toContain('alt="local"');
    expect(
      sanitizeRichContent(
        `<img src="${publicBase}images/public.webp" alt="public">`,
        { allowedImageBaseUrl: publicBase },
      ),
    ).toBe("");
  });
});

describe("isOwnedContentImageSource", () => {
  it("accepts an exact HTTPS scope descendant and rejects prefix confusion", () => {
    expect(isOwnedContentImageSource(ownedImageUrl, allowedImageBaseUrl)).toBe(
      true,
    );
    expect(
      isOwnedContentImageSource(
        `${allowedImageBaseUrl.slice(0, -1)}-sibling/images/a.webp`,
        allowedImageBaseUrl,
      ),
    ).toBe(false);
    expect(
      isOwnedContentImageSource(allowedImageBaseUrl, allowedImageBaseUrl),
    ).toBe(false);
    expect(
      isOwnedContentImageSource(
        ownedImageUrl,
        allowedImageBaseUrl.slice(0, -1),
      ),
    ).toBe(false);
  });

  it.each([
    "http://localhost:54321",
    "http://127.0.0.1:54321",
    "http://127.42.0.7:54321",
    "http://[::1]:54321",
  ])("allows exact local Supabase HTTP ownership for %s", (origin) => {
    const base = `${origin}/storage/v1/object/public/zerosourcing/content/blog/${scope}/`;
    expect(isOwnedContentImageSource(`${base}images/a.webp`, base)).toBe(true);
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
  ])("rejects unsafe or noncanonical asset ownership for %s", (origin) => {
    const base = `${origin}/storage/v1/object/public/zerosourcing/content/blog/${scope}/`;
    expect(isOwnedContentImageSource(`${base}images/a.webp`, base)).toBe(false);
  });

  it.each([
    "http://127.1:54321",
    "http://127.000.000.001:54321",
    "http://2130706433:54321",
    "http://user:secret@127.0.0.1:54321",
  ])(
    "rejects a noncanonical local candidate that normalizes to the base for %s",
    (origin) => {
      const base = `http://127.0.0.1:54321/storage/v1/object/public/zerosourcing/content/blog/${scope}/`;
      expect(
        isOwnedContentImageSource(
          `${origin}${new URL(ownedImageUrl).pathname}`,
          base,
        ),
      ).toBe(false);
    },
  );

  it.each([
    `${allowedImageBaseUrl}images/a.webp\u200b`,
    `${allowedImageBaseUrl}images/a.webp%0aevil`,
    `${allowedImageBaseUrl}images\\a.webp`,
    `https://user:secret@project.supabase.co${new URL(ownedImageUrl).pathname}`,
  ])(
    "rejects hidden, encoded, backslash, or credential smuggling in %s",
    (source) => {
      expect(isOwnedContentImageSource(source, allowedImageBaseUrl)).toBe(
        false,
      );
    },
  );

  it.each([
    ownedImageUrl.replace("https://", "https:////"),
    ownedImageUrl.replace("project.supabase.co", "PROJECT.supabase.co"),
    ownedImageUrl.replace("project.supabase.co", "project.supabase.co:443"),
    ownedImageUrl.replace("project.supabase.co", "%70roject.supabase.co"),
    ownedImageUrl.replace("/storage/v1/", "/storage/./v1/"),
    ownedImageUrl.replace("/storage/v1/", "/x/../storage/v1/"),
    ownedImageUrl.replace("/storage/v1/", "/storage/%2e/v1/"),
    ownedImageUrl.replace("/storage/v1/", "/storage/%2e%2e/storage/v1/"),
  ])("rejects browser-normalized asset aliases in %s", (source) => {
    expect(isOwnedContentImageSource(source, allowedImageBaseUrl)).toBe(false);
  });
});
