export type ContentEntity = "blog" | "portfolio";

export function createContentAssetBaseUrl(input: {
  readonly assetScope: string;
  readonly bucket: string;
  readonly entity: ContentEntity;
  readonly supabaseUrl: string;
}): string {
  let supabaseUrl: URL;
  try {
    supabaseUrl = new URL(input.supabaseUrl);
  } catch {
    throw new Error("A valid Supabase URL is required.");
  }

  const isHttp =
    supabaseUrl.protocol === "http:" || supabaseUrl.protocol === "https:";
  if (!isHttp || !supabaseUrl.hostname) {
    throw new Error("A valid Supabase URL is required.");
  }

  const path = [
    "storage",
    "v1",
    "object",
    "public",
    input.bucket,
    "content",
    input.entity,
    input.assetScope,
  ]
    .map(encodeURIComponent)
    .join("/");
  supabaseUrl.pathname = `/${path}/`;
  supabaseUrl.search = "";
  supabaseUrl.hash = "";
  return supabaseUrl.toString();
}
