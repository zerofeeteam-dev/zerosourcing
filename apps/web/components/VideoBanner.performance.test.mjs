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

test("hero video waits for user interaction before loading", async () => {
  const component = await readFile(componentPath, "utf8");

  assert.match(component, /useState\(false\)/u);
  assert.match(
    component,
    /\["keydown", "pointermove", "scroll", "touchstart"\]/u,
  );
  assert.match(component, /\{shouldPlayVideo \? \([\s\S]*?<video/u);
  assert.match(component, /preload="metadata"/u);
  assert.match(component, /banner_video_mobile\.mp4/u);
  assert.match(component, /prefers-reduced-motion: reduce/u);
});

test("hero media stays within the initial-load performance budget", async () => {
  const [desktopVideo, mobileVideo, poster] = await Promise.all([
    stat(desktopVideoPath),
    stat(mobileVideoPath),
    stat(posterPath),
  ]);

  assert.ok(desktopVideo.size <= 5_000_000);
  assert.ok(mobileVideo.size <= 750_000);
  assert.ok(poster.size <= 25_000);
});
