export const SUPABASE_PUBLIC_STORAGE_PATHNAME =
  "/storage/v1/object/public/zerosourcing/**";

const invalidUrlMessage = "SUPABASE_URL is invalid.";
const missingProductionUrlMessage =
  "SUPABASE_URL must be present at Web build time.";

function invalidUrl(cause) {
  return new Error(
    invalidUrlMessage,
    cause === undefined ? undefined : { cause },
  );
}

function hasControlCharacter(value) {
  for (const character of value) {
    const codePoint = character.codePointAt(0);
    if (
      codePoint === undefined ||
      codePoint <= 0x1f ||
      (codePoint >= 0x7f && codePoint <= 0x9f)
    ) {
      return true;
    }
  }

  return false;
}

function rawAuthority(value) {
  return /^[a-z][a-z\d+.-]*:\/\/([^/?#]+)/iu.exec(value)?.[1] ?? null;
}

function rawHostLiteral(authority) {
  if (authority.includes("@")) return null;

  if (authority.startsWith("[")) {
    const closingBracket = authority.indexOf("]");
    if (closingBracket < 0) return null;

    const host = authority.slice(0, closingBracket + 1);
    const port = authority.slice(closingBracket + 1);
    return port === "" || /^:\d+$/u.test(port) ? host : null;
  }

  const firstColon = authority.indexOf(":");
  if (firstColon < 0) return authority;
  if (firstColon !== authority.lastIndexOf(":")) return null;

  const host = authority.slice(0, firstColon);
  const port = authority.slice(firstColon + 1);
  return host && /^\d+$/u.test(port) ? host : null;
}

function isCanonicalIpv4Loopback(hostname) {
  const octets = hostname.split(".");
  return (
    octets.length === 4 &&
    octets[0] === "127" &&
    octets.every(
      (octet) => /^(?:0|[1-9]\d{0,2})$/u.test(octet) && Number(octet) <= 255,
    )
  );
}

function isLiteralLoopbackAuthority(authority) {
  const hostname = rawHostLiteral(authority)?.toLowerCase() ?? "";
  return (
    hostname === "localhost" ||
    hostname === "[::1]" ||
    isCanonicalIpv4Loopback(hostname)
  );
}

export function createSupabaseStorageRemotePattern(rawUrl) {
  if (rawUrl === undefined || rawUrl === null || rawUrl === "") return null;
  if (typeof rawUrl !== "string") throw invalidUrl();
  if (rawUrl.includes("\\") || hasControlCharacter(rawUrl)) {
    throw invalidUrl();
  }

  const value = rawUrl.trim();
  if (!value) return null;

  const authority = rawAuthority(value);
  if (!authority) throw invalidUrl();

  let baseUrl;
  try {
    baseUrl = new URL(value);
  } catch (cause) {
    throw invalidUrl(cause);
  }

  const isAllowedProtocol =
    baseUrl.protocol === "https:" ||
    (baseUrl.protocol === "http:" && isLiteralLoopbackAuthority(authority));

  if (
    !baseUrl.hostname ||
    baseUrl.username ||
    baseUrl.password ||
    !isAllowedProtocol
  ) {
    throw invalidUrl();
  }

  return new URL(SUPABASE_PUBLIC_STORAGE_PATHNAME, baseUrl.origin);
}

export function resolveSupabaseStorageRemotePatterns({
  nodeEnvironment,
  supabaseUrl,
}) {
  const storagePattern = createSupabaseStorageRemotePattern(supabaseUrl);

  if (nodeEnvironment === "production" && !storagePattern) {
    throw new Error(missingProductionUrlMessage);
  }

  return storagePattern ? [storagePattern] : [];
}
