import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const errorPagePath = new URL("./error.tsx", import.meta.url);

test("the public error boundary exposes only safe retry copy", async () => {
  const source = await readFile(errorPagePath, "utf8");

  assert.match(source, /^"use client";/);
  assert.match(source, /콘텐츠를 불러오지 못했습니다\./);
  assert.match(source, /다시 시도/);
  assert.match(source, /onClick=\{reset\}/);
  assert.doesNotMatch(
    source,
    /error\.(?:cause|message|stack)|process\.env|response\.(?:body|text)|PostgREST/,
  );
});
