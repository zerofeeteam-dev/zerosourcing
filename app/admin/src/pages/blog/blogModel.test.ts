import assert from "node:assert/strict";
import test from "node:test";
import * as blogModel from "./blogModel.ts";

test("blog list uses the Korean labels from the Figma table", () => {
  assert.equal(blogModel.blogStatusLabel("draft"), "임시저장");
  assert.equal(blogModel.blogStatusLabel("published"), "게시됨");
  assert.equal(blogModel.blogTypeLabel("insight"), "인사이트");
  assert.equal(blogModel.blogTypeLabel("application"), "어플리케이션");
  assert.equal(blogModel.blogTypeLabel("company_homepage"), "기업 홈페이지");
});

test("blog list date uses the compact Figma format", () => {
  const formatter = Reflect.get(blogModel, "formatBlogListDate") as unknown;

  assert.equal(typeof formatter, "function");
  if (typeof formatter !== "function") return;

  assert.equal(formatter("2026-03-16T09:00:00.000Z"), "26. 03. 16");
  assert.equal(formatter("not-a-date"), "-");
});
