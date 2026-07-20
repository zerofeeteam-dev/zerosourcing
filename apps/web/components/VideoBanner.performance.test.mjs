import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const componentPath = new URL("./VideoBanner.tsx", import.meta.url);
const desktopVideoPath = new URL("../public/banner_video.mp4", import.meta.url);
const mobileVideoPath = new URL(
  "../public/banner_video_mobile.mp4",
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
  assert.match(component, /banner_video_mobile\.mp4/u);
  assert.match(styles, /url\("\/banner-poster\.webp"\)/u);
  assert.doesNotMatch(component, /shouldPlayVideo|pointermove/u);
  assert.doesNotMatch(styles, /radial-gradient/u);
});

test("hero media stays within the initial-load performance budget", async () => {
  const [desktopVideo, mobileVideo, poster] = await Promise.all([
    stat(desktopVideoPath),
    stat(mobileVideoPath),
    stat(posterPath),
  ]);

  assert.ok(desktopVideo.size <= 2_500_000);
  assert.ok(mobileVideo.size <= 750_000);
  assert.ok(poster.size <= 25_000);
});
