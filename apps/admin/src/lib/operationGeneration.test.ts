import assert from "node:assert/strict";
import test from "node:test";
import { createOperationGeneration } from "./operationGeneration.ts";

test("operation tokens are valid only for their captured route", () => {
  const operations = createOperationGeneration();
  const token = operations.begin("blog:detail:a");

  assert.equal(operations.isCurrent(token, "blog:detail:a"), true);
  assert.equal(operations.isCurrent(token, "blog:detail:b"), false);
  assert.equal(operations.isCurrent(token, "blog:new"), false);
});

test("invalidating a generation rejects every earlier completion", () => {
  const operations = createOperationGeneration();
  const stale = operations.begin("portfolio:detail:a");

  operations.invalidate();

  assert.equal(operations.isCurrent(stale, "portfolio:detail:a"), false);
  const current = operations.begin("portfolio:detail:a");
  assert.equal(operations.isCurrent(current, "portfolio:detail:a"), true);
});

test("starting a newer operation supersedes an earlier operation", () => {
  const operations = createOperationGeneration();
  const first = operations.begin("blog:detail:a");
  const second = operations.begin("blog:detail:a");

  assert.equal(operations.isCurrent(first, "blog:detail:a"), false);
  assert.equal(operations.isCurrent(second, "blog:detail:a"), true);
});
