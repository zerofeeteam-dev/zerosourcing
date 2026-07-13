import assert from "node:assert/strict";
import test from "node:test";
import * as blogModel from "./blogModel.ts";

test("new blog form starts with an unselected type", () => {
  assert.equal(blogModel.emptyBlogForm.type, "");
  const result = blogModel.validateBlogForm({
    ...blogModel.emptyBlogForm,
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

  const draftForm = withStatus(blogModel.emptyBlogForm, "draft");
  const publishedForm = withStatus(blogModel.emptyBlogForm, "published");

  assert.equal(draftForm.status, "draft");
  assert.equal(publishedForm.status, "published");
  assert.equal(blogModel.emptyBlogForm.status, "draft");
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
