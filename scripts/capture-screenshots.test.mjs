import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

test("prints the four requested screenshot viewports", () => {
  const result = spawnSync(
    process.execPath,
    ["scripts/capture-screenshots.mjs", "--plan"],
    { cwd: process.cwd(), encoding: "utf8" },
  );

  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), [
    { width: 1920, height: 1080 },
    { width: 1080, height: 1080 },
    { width: 640, height: 1024 },
    { width: 390, height: 844 },
  ]);
});

test("accepts the argument separator pnpm adds before a URL", () => {
  const result = spawnSync(
    process.execPath,
    ["scripts/capture-screenshots.mjs", "--plan", "--", "http://127.0.0.1:3000"],
    { cwd: process.cwd(), encoding: "utf8" },
  );

  assert.equal(result.status, 0, result.stderr);
});

test("accepts options after the pnpm argument separator", () => {
  const result = spawnSync(
    process.execPath,
    ["scripts/capture-screenshots.mjs", "--", "--plan", "http://127.0.0.1:3000"],
    { cwd: process.cwd(), encoding: "utf8" },
  );

  assert.equal(result.status, 0, result.stderr);
});
