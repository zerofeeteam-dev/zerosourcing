import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const componentPath = new URL("./VideoBanner.tsx", import.meta.url);
const originalVideoPath = new URL(
  "../public/banner_video_origin.mp4",
  import.meta.url,
);
const posterPath = new URL("../public/banner-poster.webp", import.meta.url);

const stylesPath = new URL("./VideoBanner.module.css", import.meta.url);

test("hero video loads immediately over the matching poster", async () => {
  const [component, styles] = await Promise.all([
    readFile(componentPath, "utf8"),
    readFile(stylesPath, "utf8"),
  ]);

  assert.match(component, /<video[\s\S]*?autoPlay/u);
  assert.match(component, /poster=\{bannerPosterSrc\}/u);
  assert.match(component, /preload="auto"/u);
  assert.match(component, /banner_video_origin\.mp4/u);
  assert.doesNotMatch(component, /banner_video_mobile\.mp4/u);
  assert.match(styles, /url\("\/banner-poster\.webp"\)/u);
  assert.doesNotMatch(component, /shouldPlayVideo|pointermove/u);
  assert.doesNotMatch(styles, /radial-gradient/u);
});

test("hero media keeps the supplied original video within its source asset cap", async () => {
  const [originalVideo, poster] = await Promise.all([
    stat(originalVideoPath),
    stat(posterPath),
  ]);

  assert.ok(originalVideo.size <= 32_000_000);
  assert.ok(poster.size <= 25_000);
});
