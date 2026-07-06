/*
  Displacement-filter manager for the refraction tier of <GlassSurface>.

  Why this exists: naively, each liquid-glass element builds its own O(w*h)
  displacement map every resize and injects its own SVG <filter>. With many
  glass elements that is both a lot of pixel work and a lot of duplicated DOM.

  This module makes refraction cheap enough to reuse widely:
    1. Filters are keyed by geometry (size/radius/bezel/scale). Every element
       of the same size shares one <filter> and one displacement map.
    2. The map is generated at half resolution (the map is a smooth gradient,
       and a 2px blur runs after it, so upscaling is invisible) — that quarters
       both the pixel loop and the toDataURL() encoding, which dominates cost.
    3. The pixel loop only visits the bezel ring; the neutral interior is filled
       in one pass. So cost is ~O(perimeter * bezel), not O(area).

  Only Chromium renders url() filters inside backdrop-filter. Firefox lacks
  support and Safari drops SVG-referenced backdrop filters entirely, so callers
  must gate on supportsGlassRefraction() and fall back to the plain blur.
*/

export interface GlassFilterOptions {
  width: number;
  height: number;
  /** Corner radius in px. Defaults to a pill (height / 2). */
  radius?: number;
  /** Width of the refracted edge band in px. Defaults to radius / 2 (clamped
   *  8..24) so the lens stays proportional at any element size. */
  bezel?: number;
  /** Displacement strength passed to feDisplacementMap. Defaults to 3x the
   *  bezel — the ratio of the reference badge (bezel 10, scale 30). */
  scale?: number;
}

const QUALITY = 0.5; // map render scale; 0.5 = quarter the pixels
const QUANT = 8; // snap sizes to 8px so resizes reuse cached filters instead of minting one per pixel step

const filterCache = new Map<string, string>();
let defs: SVGSVGElement | null = null;
let idCounter = 0;
let cachedSupport: boolean | null = null;

/**
 * True only on engines that actually render url() displacement inside
 * backdrop-filter (Chromium and Chromium-based). Callers should keep the
 * cheap-tier blur when this is false.
 */
export function supportsGlassRefraction(): boolean {
  if (cachedSupport !== null) return cachedSupport;
  if (typeof window === "undefined" || typeof CSS === "undefined") {
    return false;
  }

  const hasUrlBackdrop =
    CSS.supports?.("backdrop-filter", "url(#x)") ||
    CSS.supports?.("-webkit-backdrop-filter", "url(#x)") ||
    false;

  // Safari reports support but renders nothing for SVG-referenced backdrop
  // filters, so exclude WebKit-that-isn't-Chromium.
  const ua = navigator.userAgent;
  const isSafari = /^((?!chrome|chromium|crios|android|fxios).)*safari/i.test(
    ua,
  );

  cachedSupport = hasUrlBackdrop && !isSafari;
  return cachedSupport;
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
  svg.dataset.zsGlassDefs = "";
  document.body.appendChild(svg);
  defs = svg;
  return svg;
}

/**
 * Build a normal-map-style displacement image: neutral (128,128) everywhere
 * except a bezel ring where pixels are pushed outward along the surface normal,
 * producing the lens/refraction bend at the edges.
 */
function makeDisplacementMap(
  w: number,
  h: number,
  radius: number,
  bezel: number,
): string {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const img = ctx.createImageData(w, h);
  // Fill the whole map with neutral RGBA (128,128,128,255) in one pass.
  // 0xFF808080 is that value in little-endian, which is what browsers use.
  new Uint32Array(img.data.buffer).fill(0xff808080);
  const data = img.data;

  // Rounded-rect signed distance: works for pills (radius = h/2) and plain
  // rounded rectangles alike, unlike the capsule-only formula which loses the
  // top/bottom edge refraction whenever radius < h/2.
  const hw = w / 2;
  const hh = h / 2;
  const paint = (x: number, y: number) => {
    const px = x + 0.5 - hw;
    const py = y + 0.5 - hh;
    const ax = Math.abs(px) - (hw - radius);
    const ay = Math.abs(py) - (hh - radius);
    let edge: number;
    let nx: number;
    let ny: number;
    if (ax > 0 && ay > 0) {
      // corner arc: normal points radially out of the corner circle
      const len = Math.sqrt(ax * ax + ay * ay) || 1;
      edge = radius - len;
      nx = (ax / len) * Math.sign(px);
      ny = (ay / len) * Math.sign(py);
    } else if (ax > ay) {
      edge = radius - ax; // nearest boundary is a vertical edge
      nx = Math.sign(px);
      ny = 0;
    } else {
      edge = radius - ay; // nearest boundary is a horizontal edge
      nx = 0;
      ny = Math.sign(py);
    }
    if (edge < 0 || edge >= bezel) return;
    const t = edge / bezel;
    const strength = Math.sqrt(1 - t * t);
    const i = (y * w + x) * 4;
    data[i] = 128 + nx * strength * 127; // R -> x displacement
    data[i + 1] = 128 + ny * strength * 127; // G -> y displacement
  };

  // Only the bezel ring is non-neutral: top/bottom strips of the straight-edge
  // band, plus side columns wide enough to also cover the corner arcs.
  const band = Math.min(Math.ceil(bezel), h);
  const cap = Math.min(Math.ceil(Math.max(bezel, radius)), w);
  for (let y = 0; y < h; y++) {
    if (y < band || y >= h - band) {
      for (let x = 0; x < w; x++) paint(x, y);
    } else {
      for (let x = 0; x < cap; x++) paint(x, y);
      for (let x = w - cap; x < w; x++) paint(x, y);
    }
  }

  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL();
}

/**
 * Ensure an SVG displacement filter exists for the given geometry and return
 * its id (usable as `url(#id)`). Filters are cached and shared by geometry, so
 * calling this repeatedly for the same size is effectively free.
 */
export function ensureGlassFilter(options: GlassFilterOptions): string {
  const width = Math.max(QUANT, Math.round(options.width / QUANT) * QUANT);
  const height = Math.max(QUANT, Math.round(options.height / QUANT) * QUANT);
  const radius = Math.min(
    options.radius ?? height / 2,
    width / 2,
    height / 2,
  );
  const bezel = options.bezel ?? Math.min(Math.max(radius / 2, 8), 24);
  const scale = options.scale ?? bezel * 3;

  const key = `${width}x${height}-r${Math.round(radius)}-b${Math.round(bezel)}-s${Math.round(scale)}`;
  const cached = filterCache.get(key);
  if (cached) return cached;

  const q = QUALITY;
  const mapUrl = makeDisplacementMap(
    Math.max(1, Math.round(width * q)),
    Math.max(1, Math.round(height * q)),
    radius * q,
    bezel * q,
  );

  const id = `zs-glass-${idCounter++}`;
  const svgNs = "http://www.w3.org/2000/svg";
  const filter = document.createElementNS(svgNs, "filter");
  filter.setAttribute("id", id);
  filter.setAttribute("color-interpolation-filters", "sRGB");

  const feImage = document.createElementNS(svgNs, "feImage");
  feImage.setAttribute("x", "0");
  feImage.setAttribute("y", "0");
  feImage.setAttribute("width", String(width));
  feImage.setAttribute("height", String(height));
  feImage.setAttribute("result", "map");
  feImage.setAttribute("href", mapUrl);
  feImage.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", mapUrl);

  const feDisp = document.createElementNS(svgNs, "feDisplacementMap");
  feDisp.setAttribute("in", "SourceGraphic");
  feDisp.setAttribute("in2", "map");
  feDisp.setAttribute("scale", String(scale));
  feDisp.setAttribute("xChannelSelector", "R");
  feDisp.setAttribute("yChannelSelector", "G");

  filter.appendChild(feImage);
  filter.appendChild(feDisp);
  getDefs().appendChild(filter);

  filterCache.set(key, id);
  return id;
}
