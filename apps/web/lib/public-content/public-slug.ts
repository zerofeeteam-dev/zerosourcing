const publicSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isPublicSlug(value: unknown): value is string {
  return typeof value === "string" && publicSlugPattern.test(value);
}
