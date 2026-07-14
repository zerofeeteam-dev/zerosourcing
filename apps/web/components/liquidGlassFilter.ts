/*
  Size-aware Liquid Glass filters cut from the CodePen's hand-baked map.

  The pen's filter (see liquidGlassMap.ts) is exact only for its native
  244x70 pill: with primitiveUnits="objectBoundingBox" the feImage map
  stretches with the element, so on a wide bar the rounded-cap bends smear
  and the R-channel x displacement grows with the width. This module
  re-cuts the map for arbitrary pill sizes while keeping the pen's
  material feel:

    1. 3-slice composition — both end caps are copied 1:1 in map space and
       only the flat body is stretched, so cap curvature stays circular at
       any width.
    2. The R channel (x displacement) is rescaled by penWidth/width. The
       objectBoundingBox scale of 0.5 resolves against element width, so
       without this a 1360px header would displace ~5.6x harder than the
       pen; rescaling pins horizontal bends to the pen's absolute pixels.
    3. The G channel (y displacement) is left as authored — the vertical
       lens spans the full height by design, and header heights sit close
       to the pen's 70px anyway.
    4. The in-filter blur keeps the pen's absolute softness the same way:
       x stdDeviation is rescaled by penWidth/width, y stays 0.04.

  Filters are cached per quantized size. Chromium-only — callers must gate
  on supportsGlassRefraction() from glassFilter.ts and keep the plain
  blur/saturate fallback otherwise.
*/

import { LIQUID_GLASS_MAP } from "./liquidGlassMap";

export interface LiquidGlassFilterOptions {
  width: number;
  height: number;
}

/** Element size the pen map was authored for. */
const PEN_WIDTH = 244;
/** Same stdDeviation the pen uses on both axes at its native size. */
const PEN_BLUR = 0.04;
const QUANT = 8;

const filterCache = new Map<string, Promise<string>>();
let mapImagePromise: Promise<HTMLImageElement> | null = null;
let defs: SVGSVGElement | null = null;
let idCounter = 0;

function loadMapImage(): Promise<HTMLImageElement> {
  mapImagePromise ??= new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("liquid glass map failed to decode"));
    image.src = LIQUID_GLASS_MAP;
  });
  return mapImagePromise;
}

function getDefs(): SVGSVGElement {
  if (defs) return defs;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("width", "0");
  svg.setAttribute("height", "0");
  svg.style.position = "absolute";
  svg.style.width = "0";
  svg.style.height = "0";
  svg.style.overflow = "hidden";
  svg.dataset.zsLiquidGlassDefs = "";
  document.body.appendChild(svg);
  defs = svg;
  return svg;
}

/**
 * Re-cut the pen map to the target aspect ratio (3-slice) and rescale its
 * R channel so x displacement keeps the pen's pixel strength at `width`.
 */
function composeMap(
  image: HTMLImageElement,
  width: number,
  height: number,
): string {
  const mapWidth = image.naturalWidth;
  const mapHeight = image.naturalHeight;
  // Each pill end cap spans half the map height (the corner radius).
  const cap = Math.floor(mapHeight / 2);
  const outWidth = Math.max(
    Math.round((width / height) * mapHeight),
    cap * 2 + 1,
  );

  const canvas = document.createElement("canvas");
  canvas.width = outWidth;
  canvas.height = mapHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.drawImage(image, 0, 0, cap, mapHeight, 0, 0, cap, mapHeight);
  ctx.drawImage(
    image,
    cap,
    0,
    mapWidth - cap * 2,
    mapHeight,
    cap,
    0,
    outWidth - cap * 2,
    mapHeight,
  );
  ctx.drawImage(
    image,
    mapWidth - cap,
    0,
    cap,
    mapHeight,
    outWidth - cap,
    0,
    cap,
    mapHeight,
  );

  const factor = PEN_WIDTH / width;
  if (factor !== 1) {
    const imageData = ctx.getImageData(0, 0, outWidth, mapHeight);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const r = 128 + ((data[i] as number) - 128) * factor;
      data[i] = r < 0 ? 0 : r > 255 ? 255 : Math.round(r);
    }
    ctx.putImageData(imageData, 0, 0);
  }

  return canvas.toDataURL();
}

function buildFilter(mapUrl: string, width: number): string {
  const id = `zs-liquid-glass-${idCounter++}`;
  const svgNs = "http://www.w3.org/2000/svg";

  const filter = document.createElementNS(svgNs, "filter");
  filter.setAttribute("id", id);
  filter.setAttribute("primitiveUnits", "objectBoundingBox");

  const feImage = document.createElementNS(svgNs, "feImage");
  feImage.setAttribute("x", "0");
  feImage.setAttribute("y", "0");
  feImage.setAttribute("width", "100%");
  feImage.setAttribute("height", "100%");
  feImage.setAttribute("result", "map");
  feImage.setAttribute("href", mapUrl);
  feImage.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", mapUrl);

  const feBlur = document.createElementNS(svgNs, "feGaussianBlur");
  feBlur.setAttribute("in", "SourceGraphic");
  feBlur.setAttribute("result", "blur");
  feBlur.setAttribute(
    "stdDeviation",
    `${((PEN_BLUR * PEN_WIDTH) / width).toFixed(5)} ${PEN_BLUR}`,
  );

  const feDisp = document.createElementNS(svgNs, "feDisplacementMap");
  feDisp.setAttribute("in", "blur");
  feDisp.setAttribute("in2", "map");
  feDisp.setAttribute("scale", "0.5");
  feDisp.setAttribute("xChannelSelector", "R");
  feDisp.setAttribute("yChannelSelector", "G");

  filter.appendChild(feImage);
  filter.appendChild(feBlur);
  filter.appendChild(feDisp);
  getDefs().appendChild(filter);

  return id;
}

/**
 * Ensure a pen-material displacement filter exists for the given pill size
 * and resolve its id (usable as `url(#id)`). Resolves to "" when the map
 * cannot be decoded or drawn; callers should keep the CSS fallback then.
 */
export function ensureLiquidGlassFilter(
  options: LiquidGlassFilterOptions,
): Promise<string> {
  const width = Math.max(QUANT, Math.round(options.width / QUANT) * QUANT);
  const height = Math.max(QUANT, Math.round(options.height / QUANT) * QUANT);

  const key = `${width}x${height}`;
  const cached = filterCache.get(key);
  if (cached) return cached;

  const pending = loadMapImage()
    .then((image) => {
      const mapUrl = composeMap(image, width, height);
      if (!mapUrl) return "";
      return buildFilter(mapUrl, width);
    })
    .catch(() => "");
  filterCache.set(key, pending);
  return pending;
}
