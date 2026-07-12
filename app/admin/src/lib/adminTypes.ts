export type AdminResult<TValue, TError> =
  | { readonly ok: true; readonly value: TValue }
  | { readonly ok: false; readonly error: TError };

export function adminOk<TValue>(value: TValue): AdminResult<TValue, never> {
  return { ok: true, value };
}

export function adminErr<TError>(error: TError): AdminResult<never, TError> {
  return { ok: false, error };
}

export class AdminUnexpectedVariantError extends Error {
  readonly name = "AdminUnexpectedVariantError";

  constructor(readonly value: never) {
    super("Unexpected admin variant");
  }
}

export function assertNever(value: never): never {
  throw new AdminUnexpectedVariantError(value);
}

export const adminValidationCodes = [
  "required",
  "invalid_slug",
  "invalid_thumbnail_type",
  "thumbnail_too_large",
] as const;

export type AdminValidationCode = (typeof adminValidationCodes)[number];

export type AdminValidationIssue = {
  readonly code: AdminValidationCode;
  readonly field: string;
  readonly message: string;
};

export type AdminSlug = {
  readonly value: string;
};

export type AdminRequiredString = {
  readonly value: string;
};

export const adminThumbnailMimeTypes = ["image/png", "image/jpeg", "image/webp"] as const;

export type AdminThumbnailMimeType = (typeof adminThumbnailMimeTypes)[number];

export type AdminThumbnailFile = {
  readonly file: File;
  readonly mimeType: AdminThumbnailMimeType;
  readonly sizeBytes: number;
};
