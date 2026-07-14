import assert from "node:assert/strict";
import test from "node:test";
import type { PortfolioRow } from "../../lib/adminRepositoryTypes.ts";
import * as portfolioModel from "./portfolioModel.ts";

const rawSource =
  "<!DOCTYPE html>\n<html><body>  <p>원문</p>\n</body></html>\n";
const contentAssetScope = "00000000-0000-4000-8000-000000000002";

function portfolioRow(
  overrides: Partial<PortfolioRow> = {},
): PortfolioRow {
  return {
    company_name: "원문 테스트",
    content: rawSource,
    content_asset_base_enabled: false,
    content_asset_scope: contentAssetScope,
    content_authoring_mode: "raw_html",
    content_json: null,
    content_mode: "html",
    content_schema_version: 1,
    content_source_backup: null,
    core_features: [],
    created_at: "2026-07-14T00:00:00.000Z",
    deleted_at: null,
    development_period: "",
    estimate_label: "",
    id: "00000000-0000-4000-8000-000000000001",
    landing_published: false,
    landing_sections: [],
    product_description: "",
    published_at: null,
    seo_description: "",
    service_published: false,
    service_sections: [],
    slug: "raw-test",
    status: "draft",
    thumbnail_alt: "원문 썸네일",
    thumbnail_path: "portfolio/raw-test/thumb.webp",
    thumbnail_public_url: "https://cdn.example.com/thumb.webp",
    title: "원문 테스트",
    type: "mvp",
    updated_at: "2026-07-14T00:00:00.000Z",
    work_scopes: [],
    ...overrides,
  };
}

test("raw HTML round-trips without trimming or normalization", () => {
  const form = portfolioModel.portfolioFormFromRow(portfolioRow());

  assert.equal(form.content, rawSource);
  assert.equal(form.contentAuthoringMode, "raw_html");
  assert.equal(form.contentJson, null);
  assert.equal(form.contentAssetBaseEnabled, false);
  assert.equal(form.contentAssetScope, contentAssetScope);
  assert.equal(form.thumbnailPath, "portfolio/raw-test/thumb.webp");

  const rebuilt = portfolioModel.buildPortfolioInput(form);
  assert.ok(rebuilt.input);
  assert.equal(rebuilt.input.content, rawSource);
  assert.equal(rebuilt.input.contentAssetBaseEnabled, false);
  assert.equal(rebuilt.input.contentAuthoringMode, "raw_html");
  assert.equal(rebuilt.input.contentAssetScope, contentAssetScope);
  assert.equal(rebuilt.input.contentSchemaVersion, 1);
  assert.equal(rebuilt.input.thumbnailAlt, "원문 썸네일");
});

test("published WYSIWYG content emits JSON and generated HTML together", () => {
  const base = portfolioModel.createEmptyPortfolioFormState();
  const result = portfolioModel.buildPortfolioInput({
    ...base,
    companyName: "WYSIWYG 테스트",
    content: "<p>본문</p>",
    contentAuthoringMode: "wysiwyg",
    contentJson: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "본문" }],
        },
      ],
    },
    contentMode: "html",
    slug: "wysiwyg-test",
    status: "published",
    title: "WYSIWYG 테스트",
    type: "mvp",
  });

  assert.ok(result.input);
  assert.equal(result.input.content, "<p>본문</p>");
  assert.equal(result.input.contentAuthoringMode, "wysiwyg");
  assert.equal(result.input.contentMode, "html");
  assert.equal(result.input.contentJson.type, "doc");
});

for (const fixture of [
  {
    html: '<img src="https://cdn.example.com/content.webp">',
    label: "an image-only document",
    node: {
      type: "image",
      attrs: { src: "https://cdn.example.com/content.webp" },
    },
  },
  {
    html: "<hr>",
    label: "a horizontal-rule-only document",
    node: { type: "horizontalRule" },
  },
] as const) {
  test(`Portfolio publishing accepts ${fixture.label}`, () => {
    const result = portfolioModel.buildPortfolioInput({
      ...portfolioModel.createEmptyPortfolioFormState(),
      companyName: "비텍스트 본문 테스트",
      content: fixture.html,
      contentJson: { type: "doc", content: [fixture.node] },
      slug: "non-text-content-test",
      status: "published",
      title: "비텍스트 본문 테스트",
      type: "mvp",
    });

    assert.ok(result.input);
    assert.equal(result.errors.content, undefined);
  });
}

test("draft may be empty but publish requires visible content", () => {
  const base = {
    ...portfolioModel.createEmptyPortfolioFormState(),
    companyName: "빈 본문 테스트",
    slug: "empty-test",
    title: "빈 본문 테스트",
    type: "mvp" as const,
  };

  assert.ok(
    portfolioModel.buildPortfolioInput({ ...base, status: "draft" }).input,
  );

  const published = portfolioModel.buildPortfolioInput({
    ...base,
    status: "published",
  });
  assert.equal(published.input, undefined);
  assert.equal(published.errors.content, "게시하려면 본문을 입력해 주세요.");
});

test("empty-form factories allocate stable, record-specific asset scopes", () => {
  const first = portfolioModel.createEmptyPortfolioFormState();
  const second = portfolioModel.createEmptyPortfolioFormState();

  assert.match(
    first.contentAssetScope,
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  );
  assert.notEqual(first.contentAssetScope, second.contentAssetScope);

  const rebuilt = portfolioModel.buildPortfolioInput({
    ...first,
    companyName: "스코프 테스트",
    slug: "scope-test",
    title: "스코프 테스트",
    type: "application",
  });
  assert.ok(rebuilt.input);
  assert.equal(rebuilt.input.contentAssetScope, first.contentAssetScope);
});

test("row mapping fails closed for unsupported schemas and malformed documents", () => {
  assert.throws(
    () =>
      portfolioModel.portfolioFormFromRow(
        portfolioRow({ content_schema_version: 2 }),
      ),
    { message: "이 글은 현재 에디터보다 새로운 형식이어서 수정할 수 없습니다." },
  );

  assert.throws(
    () =>
      portfolioModel.portfolioFormFromRow(
        portfolioRow({
          content_authoring_mode: "wysiwyg",
          content_json: {} as PortfolioRow["content_json"],
        }),
      ),
    { message: "이 글은 현재 에디터보다 새로운 형식이어서 수정할 수 없습니다." },
  );

  assert.doesNotThrow(() =>
    portfolioModel.portfolioFormFromRow(
      portfolioRow({
        content_authoring_mode: "raw_html",
        content_json: { type: "doc", content: [{ type: "paragraph" }] },
      }),
    ),
  );
});
