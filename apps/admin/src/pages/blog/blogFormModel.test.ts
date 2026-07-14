import assert from "node:assert/strict";
import test from "node:test";
import type { BlogPostRow } from "../../lib/adminRepositoryTypes.ts";
import * as blogModel from "./blogModel.ts";

const rawSource =
  "<!DOCTYPE html>\n<html><body>  <p>원문</p>\n</body></html>\n";
const contentAssetScope = "00000000-0000-4000-8000-000000000012";

function blogPostRow(overrides: Partial<BlogPostRow> = {}): BlogPostRow {
  return {
    banner_published: false,
    banner_sections: [],
    content: rawSource,
    content_asset_base_enabled: true,
    content_asset_scope: contentAssetScope,
    content_authoring_mode: "raw_html",
    content_json: null,
    content_mode: "html",
    content_schema_version: 1,
    content_source_backup: null,
    created_at: "2026-07-14T00:00:00.000Z",
    deleted_at: null,
    id: "00000000-0000-4000-8000-000000000011",
    landing_published: false,
    landing_sections: [],
    published_at: null,
    published_date: null,
    seo_description: "",
    slug: "raw-blog-test",
    status: "draft",
    summary: "카드 요약",
    thumbnail_alt: "원문 썸네일",
    thumbnail_path: "raw-blog-test/thumb.webp",
    thumbnail_public_url: "https://cdn.example.com/blog-thumb.webp",
    title: "원문 테스트",
    type: "insight",
    updated_at: "2026-07-14T00:00:00.000Z",
    ...overrides,
  };
}

test("new blog form starts with an unselected type", () => {
  const emptyForm = blogModel.createEmptyBlogFormState();
  assert.equal(emptyForm.type, "");
  const result = blogModel.validateBlogForm({
    ...emptyForm,
    slug: "new-blog",
    title: "새 블로그",
  });

  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.fields.type, "블로그 유형을 선택해주세요.");
});

test("blog form derives the requested save status without mutating the current form", () => {
  const withStatus = Reflect.get(blogModel, "blogFormWithStatus") as unknown;

  assert.equal(typeof withStatus, "function");
  if (typeof withStatus !== "function") return;

  const emptyForm = blogModel.createEmptyBlogFormState();
  const draftForm = withStatus(emptyForm, "draft");
  const publishedForm = withStatus(emptyForm, "published");

  assert.equal(draftForm.status, "draft");
  assert.equal(publishedForm.status, "published");
  assert.equal(emptyForm.status, "draft");
});

test("blog settings count array and object entries dynamically", () => {
  const count = Reflect.get(blogModel, "blogSectionCount") as unknown;

  assert.equal(typeof count, "function");
  if (typeof count !== "function") return;

  assert.equal(count("[]"), 0);
  assert.equal(count('[{"id":1},{"id":2}]'), 2);
  assert.equal(count('{"hero":{},"cta":{},"faq":{}}'), 3);
  assert.equal(count("invalid json"), 0);
});

test("raw Blog HTML and summary round-trip without source normalization", () => {
  const form = blogModel.blogFormFromRow(blogPostRow());

  assert.equal(form.content, rawSource);
  assert.equal(form.contentAuthoringMode, "raw_html");
  assert.equal(form.contentJson, null);
  assert.equal(form.contentAssetBaseEnabled, true);
  assert.equal(form.contentAssetScope, contentAssetScope);
  assert.equal(form.summary, "카드 요약");

  const rebuilt = blogModel.validateBlogForm(form);
  assert.equal(rebuilt.ok, true);
  if (!rebuilt.ok) return;
  assert.equal(rebuilt.value.content, rawSource);
  assert.equal(rebuilt.value.contentAssetBaseEnabled, true);
  assert.equal(rebuilt.value.contentAuthoringMode, "raw_html");
  assert.equal(rebuilt.value.contentAssetScope, contentAssetScope);
  assert.equal(rebuilt.value.contentSchemaVersion, 1);
  assert.equal(rebuilt.value.summary, "카드 요약");
});

test("published Blog WYSIWYG content emits JSON and generated HTML together", () => {
  const result = blogModel.validateBlogForm({
    ...blogModel.createEmptyBlogFormState(),
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
    slug: "wysiwyg-blog-test",
    status: "published",
    summary: "카드 요약",
    title: "WYSIWYG 블로그 테스트",
    type: "insight",
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.content, "<p>본문</p>");
  assert.equal(result.value.contentAuthoringMode, "wysiwyg");
  if (result.value.contentAuthoringMode !== "wysiwyg") return;
  assert.equal(result.value.contentJson.type, "doc");
});

for (const fixture of [
  {
    html: '<img src="https://cdn.example.com/blog-content.webp">',
    label: "an image-only document",
    node: {
      type: "image",
      attrs: { src: "https://cdn.example.com/blog-content.webp" },
    },
  },
  {
    html: "<hr>",
    label: "a horizontal-rule-only document",
    node: { type: "horizontalRule" },
  },
] as const) {
  test(`Blog publishing accepts ${fixture.label}`, () => {
    const result = blogModel.validateBlogForm({
      ...blogModel.createEmptyBlogFormState(),
      content: fixture.html,
      contentJson: { type: "doc", content: [fixture.node] },
      slug: "non-text-blog-content-test",
      status: "published",
      summary: "카드 요약",
      title: "비텍스트 블로그 본문 테스트",
      type: "insight",
    });

    assert.equal(result.ok, true);
  });
}

test("Blog drafts may be empty but publishing requires content and summary", () => {
  const base = {
    ...blogModel.createEmptyBlogFormState(),
    slug: "empty-blog-test",
    title: "빈 블로그 테스트",
    type: "insight" as const,
  };

  assert.equal(blogModel.validateBlogForm({ ...base, status: "draft" }).ok, true);

  const published = blogModel.validateBlogForm({
    ...base,
    status: "published",
  });
  assert.equal(published.ok, false);
  if (published.ok) return;
  assert.equal(published.fields.content, "게시하려면 본문을 입력해 주세요.");
  assert.equal(
    published.fields.summary,
    "게시하려면 카드 요약을 입력해 주세요.",
  );
});

test("Blog empty-form factories allocate record-specific asset scopes", () => {
  const first = blogModel.createEmptyBlogFormState();
  const second = blogModel.createEmptyBlogFormState();

  assert.match(
    first.contentAssetScope,
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  );
  assert.notEqual(first.contentAssetScope, second.contentAssetScope);
});

test("Blog row mapping fails closed for unsupported editor schemas", () => {
  assert.throws(
    () =>
      blogModel.blogFormFromRow(blogPostRow({ content_schema_version: 2 })),
    { message: "이 글은 현재 에디터보다 새로운 형식이어서 수정할 수 없습니다." },
  );

  assert.throws(
    () =>
      blogModel.blogFormFromRow(
        blogPostRow({
          content_authoring_mode: "wysiwyg",
          content_json: [] as unknown as BlogPostRow["content_json"],
        }),
      ),
    { message: "이 글은 현재 에디터보다 새로운 형식이어서 수정할 수 없습니다." },
  );
});
