import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const blogClientPath = new URL("./BlogListClient.tsx", import.meta.url);
const blogStylesPath = new URL("./blog.module.css", import.meta.url);
const designSystemPath = new URL(
  "../../../../design-system.css",
  import.meta.url,
);

function tokenHex(source, name) {
  const value = new RegExp(`${name}:\\s*(#[0-9a-f]{6});`, "iu").exec(
    source,
  )?.[1];
  assert.ok(value, `Missing design token ${name}`);
  return value;
}

function relativeLuminance(hex) {
  const channels = [1, 3, 5].map((offset) =>
    Number.parseInt(hex.slice(offset, offset + 2), 16),
  );
  const linear = channels.map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrastRatio(foreground, background) {
  const light = Math.max(
    relativeLuminance(foreground),
    relativeLuminance(background),
  );
  const dark = Math.min(
    relativeLuminance(foreground),
    relativeLuminance(background),
  );
  return (light + 0.05) / (dark + 0.05);
}

test("featured Blog fallback removes the overlay and keeps text accessible", async () => {
  const [client, styles, designSystem] = await Promise.all([
    readFile(blogClientPath, "utf8"),
    readFile(blogStylesPath, "utf8"),
    readFile(designSystemPath, "utf8"),
  ]);

  assert.match(
    client,
    /featured\.thumbnailUrl\s*\?\s*""\s*:\s*styles\.featuredCardFallback/u,
  );
  assert.match(
    client,
    /featured\.thumbnailUrl\s*\?\s*\(\s*<span aria-hidden="true" className=\{styles\.featuredOverlay\} \/>\s*\)\s*:\s*null/u,
  );
  assert.match(
    styles,
    /\.featuredCardFallback \.featuredTitle\s*\{[^}]*color:\s*var\(--color-gray-800\);/u,
  );
  assert.match(
    styles,
    /\.featuredCardFallback \.featuredDescription\s*\{[^}]*color:\s*var\(--color-gray-600\);/u,
  );

  const background = tokenHex(designSystem, "--color-gray-50");
  const title = tokenHex(designSystem, "--color-gray-800");
  const description = tokenHex(designSystem, "--color-gray-600");
  assert.ok(contrastRatio(title, background) >= 4.5);
  assert.ok(contrastRatio(description, background) >= 4.5);
});
