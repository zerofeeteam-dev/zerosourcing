import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const bottomCtaBannerPath = new URL("./BottomCtaBanner.tsx", import.meta.url);
const componentPath = new URL("./BannerEyebrowChip.tsx", import.meta.url);
const packagePath = new URL("../package.json", import.meta.url);
const stylesPath = new URL("./BannerEyebrowChip.module.css", import.meta.url);
const videoBannerPath = new URL("./VideoBanner.tsx", import.meta.url);

test("BannerEyebrowChip uses the liquid-glass library", async () => {
  const [component, styles, packageSource] = await Promise.all([
    readFile(componentPath, "utf8"),
    readFile(stylesPath, "utf8"),
    readFile(packagePath, "utf8"),
  ]);
  const packageJson = JSON.parse(packageSource);
  const chip = component.match(/<LiquidGlass[\s\S]*?<\/LiquidGlass>/u)?.[0];
  const textRule = styles.match(/\.text\s*\{([\s\S]*?)\}/u)?.[1];

  assert.equal(packageJson.dependencies["simple-liquid-glass"], "4.1.0");
  assert.match(
    component,
    /import dynamic from "next\/dynamic";/u,
  );
  assert.match(
    component,
    /import\("simple-liquid-glass"\)[\s\S]*?module\.LiquidGlass[\s\S]*?ssr: false/u,
  );
  assert.ok(chip, "LiquidGlass eyebrow wrapper is missing");

  for (const expected of [
    'mode="custom"',
    "scale={200}",
    "radius={32}",
    'borderColor="rgb(255, 255, 255)"',
    "displace={1.2}",
    "blur={3}",
    "dispersion={110}",
    "saturation={180}",
    "aberrationIntensity={2}",
    "frost={0.25}",
    "autoTextColor",
    "forceTextColor",
    'quality="high"',
  ]) {
    assert.ok(chip.includes(expected), `Missing ${expected}`);
  }

  assert.match(
    chip,
    /<p className=\{styles\.text\}>\{children\}<\/p>/u,
  );
  assert.match(chip, /style=\{chipStyle\}/u);
  assert.ok(textRule, "Eyebrow text rule is missing");
  for (const expected of [
    /width:\s*100%;/u,
    /height:\s*100%;/u,
    /display:\s*flex;/u,
    /align-items:\s*center;/u,
    /justify-content:\s*center;/u,
    /text-align:\s*center;/u,
  ]) {
    assert.match(textRule, expected);
  }
  assert.doesNotMatch(
    chip,
    /\bangle=|\bborder=|\blens=|\bliquid=|\bmobileFallback=|\beffectMode=|\balpha=|\bglassColor=|\blightness=|\bsplay=/u,
  );
  assert.doesNotMatch(
    styles,
    /\.chip::before|backdrop-filter|background-image/u,
  );
});

test("hero and bottom banners share the liquid-glass eyebrow chip", async () => {
  const [bottomCtaBanner, videoBanner] = await Promise.all([
    readFile(bottomCtaBannerPath, "utf8"),
    readFile(videoBannerPath, "utf8"),
  ]);

  assert.match(bottomCtaBanner, /import \{ BannerEyebrowChip \} from "\.\/BannerEyebrowChip";/u);
  assert.match(
    bottomCtaBanner,
    /<BannerEyebrowChip>\{eyebrow\}<\/BannerEyebrowChip>/u,
  );
  assert.match(videoBanner, /import \{ BannerEyebrowChip \} from "\.\/BannerEyebrowChip";/u);
  assert.match(
    videoBanner,
    /<BannerEyebrowChip>\{eyebrow\}<\/BannerEyebrowChip>/u,
  );
});
