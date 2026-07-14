import { parseAllowedAssetHttpUrl } from "@repo/content/asset-url";
import sanitizeHtml from "sanitize-html";

const maximumEncodedUrlDepth = 4;
const percentEscapePattern = /%[\da-f]{2}/iu;
const malformedPercentPattern = /%(?![\da-f]{2})/iu;
const pathTraversalPattern = /(?:^|\/)\.{1,2}(?=$|[/?#])/u;
const allowedLinkProtocols = new Set(["http:", "https:", "mailto:", "tel:"]);

function hasUnsafeUrlCharacter(value: string): boolean {
  for (const character of value) {
    const codePoint = character.codePointAt(0);
    if (
      codePoint === undefined ||
      codePoint <= 0x1f ||
      (codePoint >= 0x7f && codePoint <= 0x9f) ||
      (codePoint >= 0x200b && codePoint <= 0x200f) ||
      (codePoint >= 0x202a && codePoint <= 0x202e) ||
      (codePoint >= 0x2060 && codePoint <= 0x2069) ||
      codePoint === 0x061c ||
      codePoint === 0xfeff ||
      character === "\\" ||
      /\s/u.test(character)
    ) {
      return true;
    }
  }

  return false;
}

function hasUnsafeUrlEncoding(
  value: string,
  rejectPathTraversal: boolean,
): boolean {
  let decoded = value;

  for (let depth = 0; depth <= maximumEncodedUrlDepth; depth += 1) {
    if (
      hasUnsafeUrlCharacter(decoded) ||
      (rejectPathTraversal && pathTraversalPattern.test(decoded))
    ) {
      return true;
    }

    if (!decoded.includes("%")) return false;
    if (!percentEscapePattern.test(decoded)) {
      // A literal percent is only valid when a previous, well-formed %25
      // escape produced it. A literal percent in the original URL is invalid.
      return depth === 0;
    }
    if (malformedPercentPattern.test(decoded)) return true;
    if (depth === maximumEncodedUrlDepth) return true;

    try {
      decoded = decodeURIComponent(decoded);
    } catch {
      return true;
    }
  }

  return true;
}

function parseAbsoluteUrl(
  value: unknown,
  rejectPathTraversal: boolean,
): URL | null {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    hasUnsafeUrlEncoding(value, rejectPathTraversal)
  ) {
    return null;
  }

  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function parseAllowedContentAssetUrl(value: unknown): URL | null {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    hasUnsafeUrlEncoding(value, true)
  ) {
    return null;
  }

  return parseAllowedAssetHttpUrl(value);
}

function parseAllowedImageBaseUrl(value: unknown): URL | null {
  const base = parseAllowedContentAssetUrl(value);
  if (
    base === null ||
    base.search.length > 0 ||
    base.hash.length > 0 ||
    !base.pathname.endsWith("/")
  ) {
    return null;
  }

  return base;
}

function isOwnedByParsedImageBase(source: unknown, base: URL): boolean {
  const candidate = parseAllowedContentAssetUrl(source);
  if (
    candidate === null ||
    candidate.search.length > 0 ||
    candidate.hash.length > 0 ||
    candidate.protocol !== base.protocol ||
    candidate.origin !== base.origin ||
    candidate.pathname === base.pathname ||
    !candidate.pathname.startsWith(base.pathname)
  ) {
    return false;
  }

  return true;
}

/**
 * Returns true only for an absolute image URL below one exact record scope.
 * The scope URL itself must end in `/`; that delimiter prevents sibling
 * scopes with a shared string prefix from being treated as owned assets.
 */
export function isOwnedContentImageSource(
  source: unknown,
  allowedImageBaseUrl: unknown,
): boolean {
  const base = parseAllowedImageBaseUrl(allowedImageBaseUrl);
  return base !== null && isOwnedByParsedImageBase(source, base);
}

function isAllowedLinkHref(href: unknown): href is string {
  if (typeof href !== "string") return false;

  const candidate = parseAbsoluteUrl(href, false);
  if (
    candidate === null ||
    !allowedLinkProtocols.has(candidate.protocol.toLowerCase())
  ) {
    return false;
  }

  if (candidate.protocol === "http:" || candidate.protocol === "https:") {
    return (
      candidate.hostname.length > 0 &&
      candidate.username.length === 0 &&
      candidate.password.length === 0
    );
  }

  const lowerHref = href.toLowerCase();
  return (
    !lowerHref.startsWith(`${candidate.protocol}//`) &&
    candidate.pathname.length > 0
  );
}

function managedImageAttributes(
  attributes: Readonly<Record<string, string>>,
): Record<string, string> {
  const managedAttributes: Record<string, string> = {
    ...attributes,
    loading: "lazy",
  };
  for (const dimension of ["width", "height"] as const) {
    const value = managedAttributes[dimension];
    if (value !== undefined && !/^[1-9]\d{0,4}$/u.test(value)) {
      delete managedAttributes[dimension];
    }
  }
  return managedAttributes;
}

function managedLinkAttributes(
  attributes: Readonly<Record<string, string>>,
): Record<string, string> {
  if (!isAllowedLinkHref(attributes.href)) return {};
  return {
    href: attributes.href,
    rel: "noopener noreferrer",
    target: "_blank",
  };
}

export function sanitizeRichContent(
  html: string,
  options: { readonly allowedImageBaseUrl: string },
): string {
  const allowedImageBase = parseAllowedImageBaseUrl(
    options.allowedImageBaseUrl,
  );

  return sanitizeHtml(html, {
    allowedAttributes: {
      a: ["href", "target", "rel"],
      h2: ["style"],
      h3: ["style"],
      h4: ["style"],
      img: ["src", "alt", "title", "width", "height", "loading"],
      p: ["style"],
    },
    allowedSchemes: ["http", "https"],
    allowedSchemesAppliedToAttributes: ["href", "src"],
    allowedSchemesByTag: {
      a: ["http", "https", "mailto", "tel"],
      img: ["http", "https"],
    },
    allowedStyles: {
      h2: { "text-align": [/^(?:left|center|right)$/u] },
      h3: { "text-align": [/^(?:left|center|right)$/u] },
      h4: { "text-align": [/^(?:left|center|right)$/u] },
      p: { "text-align": [/^(?:left|center|right)$/u] },
    },
    allowedTags: [
      "p",
      "h2",
      "h3",
      "h4",
      "ul",
      "ol",
      "li",
      "blockquote",
      "pre",
      "code",
      "strong",
      "em",
      "u",
      "s",
      "a",
      "br",
      "hr",
      "img",
    ],
    allowProtocolRelative: false,
    disallowedTagsMode: "completelyDiscard",
    exclusiveFilter: (frame) =>
      frame.tag === "img" &&
      (allowedImageBase === null ||
        !isOwnedByParsedImageBase(frame.attribs.src, allowedImageBase)),
    nestingLimit: 100,
    transformTags: {
      a: (tagName, attributes) => ({
        attribs: managedLinkAttributes(attributes),
        tagName,
      }),
      img: (tagName, attributes) => ({
        attribs: managedImageAttributes(attributes),
        tagName,
      }),
    },
  });
}
