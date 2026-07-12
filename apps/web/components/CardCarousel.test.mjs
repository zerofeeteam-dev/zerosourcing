import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const carouselStylesPath = new URL("./CardCarousel.module.css", import.meta.url);
const carouselComponentPath = new URL("./CardCarousel.tsx", import.meta.url);

test("card carousel uses an 8px gap at 1080px and below", async () => {
  const carouselStyles = await readFile(carouselStylesPath, "utf8");

  assert.match(
    carouselStyles,
    /@media \(max-width: 1080px\)\s*{\s*\.viewport\[data-mode="carousel"\] \.track\s*{\s*gap:\s*8px;/,
  );
});

test("card carousel can opt into a narrower item width at 480px and below", async () => {
  const [carouselComponent, carouselStyles] = await Promise.all([
    readFile(carouselComponentPath, "utf8"),
    readFile(carouselStylesPath, "utf8"),
  ]);

  assert.match(carouselComponent, /mobileItemWidth\?: number;/);
  assert.match(
    carouselComponent,
    /"--carousel-item-width-mobile": `\$\{mobileItemWidth \?\? minItemWidth\}px`,/,
  );
  assert.match(
    carouselStyles,
    /@media \(max-width: 480px\)\s*{\s*\.viewport\[data-mode="carousel"\] \.track > \*\s*{\s*flex-basis:\s*min\(var\(--carousel-item-width-mobile\), 100%\);/,
  );
});
