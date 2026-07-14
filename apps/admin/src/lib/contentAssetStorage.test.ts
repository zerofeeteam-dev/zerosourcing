import {
  CONTENT_STORAGE_BUCKET,
  createContentAssetBaseUrl,
} from "@repo/content/asset-url";
import { StorageApiError } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { adminFailureMessage } from "./adminErrors";
import {
  adminContentAssetBaseUrl,
  contentImageMaxSizeBytes,
  isContentImagePublicUrlOwnedBy,
  removeContentAsset,
  uploadContentAsset,
  uploadRawHtmlAsset,
} from "./contentAssetStorage";
import type { SupabaseConfig } from "./supabase";

const assetScope = "00000000-0000-4000-8000-000000000001";
const supabaseUrl = "https://project.supabase.co";

type FakeStorageOptions = {
  readonly configUrl?: string;
  readonly publicUrl?: string;
  readonly publicUrlError?: unknown;
  readonly removeError?: unknown;
  readonly removeThrownError?: unknown;
  readonly responsePath?: string;
  readonly uploadError?: unknown;
  readonly uploadThrownError?: unknown;
};

function createStorageUnknownError(): Error {
  return Object.assign(new Error("fetch failed"), {
    name: "StorageUnknownError",
    originalError: new TypeError("fetch failed"),
    status: undefined,
    statusCode: undefined,
  });
}

function createImageFile(name: string, type: string, size = 4): File {
  const file = new File(["data"], name, { type });
  Object.defineProperty(file, "size", { configurable: true, value: size });
  return file;
}

function createFakeStorage(options: FakeStorageOptions = {}) {
  const configUrl = options.configUrl ?? supabaseUrl;
  const events: string[] = [];
  const upload = vi.fn(async (path: string) => {
    events.push(`upload:${path}`);
    if (options.uploadThrownError) throw options.uploadThrownError;
    if (options.uploadError) return { data: null, error: options.uploadError };
    return {
      data: {
        fullPath: `${CONTENT_STORAGE_BUCKET}/${path}`,
        id: "object-id",
        path: options.responsePath ?? path,
      },
      error: null,
    };
  });
  const getPublicUrl = vi.fn((path: string) => {
    events.push(`public-url:${path}`);
    if (options.publicUrlError) throw options.publicUrlError;
    return {
      data: {
        publicUrl:
          options.publicUrl ??
          `${configUrl}/storage/v1/object/public/${CONTENT_STORAGE_BUCKET}/` +
            path.split("/").map(encodeURIComponent).join("/"),
      },
    };
  });
  const remove = vi.fn(async (paths: readonly string[]) => {
    events.push(`remove:${paths.join(",")}`);
    if (options.removeThrownError) throw options.removeThrownError;
    if (options.removeError) return { data: null, error: options.removeError };
    return { data: [], error: null };
  });
  const bucketApi = { getPublicUrl, remove, upload };
  const from = vi.fn(() => bucketApi);
  const config = {
    client: { storage: { from } },
    kind: "enabled",
    url: configUrl,
  } as unknown as SupabaseConfig;

  return { config, events, from, getPublicUrl, remove, upload };
}

function disabledConfig(): SupabaseConfig {
  return {
    kind: "disabled",
    message: "Supabase 설정이 필요합니다.",
    missing: ["VITE_SUPABASE_URL"],
  };
}

describe("content asset URL contract", () => {
  it("uses the exact shared base URL and fixed bucket", () => {
    const { config } = createFakeStorage();

    expect(adminContentAssetBaseUrl(config, "blog", assetScope)).toBe(
      createContentAssetBaseUrl({
        assetScope,
        entity: "blog",
        supabaseUrl,
      }),
    );
    expect(CONTENT_STORAGE_BUCKET).toBe("zerosourcing");
  });

  it("does not construct a base URL when Supabase is disabled", () => {
    expect(
      adminContentAssetBaseUrl(disabledConfig(), "portfolio", assetScope),
    ).toBeUndefined();
  });

  it("accepts an immutable HTTPS image in the exact entity and scope", () => {
    const { config } = createFakeStorage();
    const publicUrl =
      `${supabaseUrl}/storage/v1/object/public/zerosourcing/` +
      `content/blog/${assetScope}/images/00000000-0000-4000-8000-000000000099.png`;

    expect(
      isContentImagePublicUrlOwnedBy(config, {
        assetScope: assetScope.toUpperCase(),
        entity: "blog",
        publicUrl,
      }),
    ).toBe(true);
  });

  it("accepts only the configured exact loopback HTTP origin", () => {
    const loopbackOrigin = "http://127.0.0.1:54321";
    const publicUrl =
      `${loopbackOrigin}/storage/v1/object/public/zerosourcing/` +
      `content/blog/${assetScope}/images/00000000-0000-4000-8000-000000000099.png`;

    expect(
      isContentImagePublicUrlOwnedBy(
        createFakeStorage({ configUrl: loopbackOrigin }).config,
        { assetScope, entity: "blog", publicUrl },
      ),
    ).toBe(true);
    expect(
      isContentImagePublicUrlOwnedBy(
        createFakeStorage({ configUrl: "http://127.0.0.1:54322" }).config,
        { assetScope, entity: "blog", publicUrl },
      ),
    ).toBe(false);
    expect(
      isContentImagePublicUrlOwnedBy(
        createFakeStorage({ configUrl: "http://storage.example.com" }).config,
        {
          assetScope,
          entity: "blog",
          publicUrl:
            `http://storage.example.com/storage/v1/object/public/zerosourcing/` +
            `content/blog/${assetScope}/images/00000000-0000-4000-8000-000000000099.png`,
        },
      ),
    ).toBe(false);
  });

  it.each([
    `http://project.supabase.co/storage/v1/object/public/zerosourcing/content/blog/${assetScope}/images/00000000-0000-4000-8000-000000000099.png`,
    `https://other.example/storage/v1/object/public/zerosourcing/content/blog/${assetScope}/images/00000000-0000-4000-8000-000000000099.png`,
    `${supabaseUrl}/storage/v1/object/public/zerosourcing/content/portfolio/${assetScope}/images/00000000-0000-4000-8000-000000000099.png`,
    `${supabaseUrl}/storage/v1/object/public/zerosourcing/content/blog/00000000-0000-4000-8000-000000000002/images/00000000-0000-4000-8000-000000000099.png`,
    `${supabaseUrl}/storage/v1/object/public/zerosourcing/content/blog/${assetScope}/images/not-immutable.png`,
    `${supabaseUrl}/storage/v1/object/public/zerosourcing/content/blog/${assetScope}/images/00000000-0000-4000-8000-000000000099.png?v=2`,
    `${supabaseUrl}/storage/v1/object/public/zerosourcing/content/blog/${assetScope}/images/00000000-0000-4000-8000-000000000099.png#preview`,
    `https://editor:secret@project.supabase.co/storage/v1/object/public/zerosourcing/content/blog/${assetScope}/images/00000000-0000-4000-8000-000000000099.png`,
    `${supabaseUrl}/storage/v1/object/public/zerosourcing/content/%62log/${assetScope}/images/00000000-0000-4000-8000-000000000099.png`,
    `${supabaseUrl}/storage/v1/object/public/zerosourcing/content/blog/%30${assetScope.slice(1)}/images/00000000-0000-4000-8000-000000000099.png`,
    `${supabaseUrl}/storage/v1/object/public/zerosourcing/content/blog/${assetScope}/images/%3000000000-0000-4000-8000-000000000099.png`,
  ])("rejects a non-owned editor image URL %s", (publicUrl) => {
    const { config } = createFakeStorage();
    expect(
      isContentImagePublicUrlOwnedBy(config, {
        assetScope,
        entity: "blog",
        publicUrl,
      }),
    ).toBe(false);
  });

  it("rejects image ownership when Storage is disabled or scope is invalid", () => {
    const publicUrl =
      `${supabaseUrl}/storage/v1/object/public/zerosourcing/` +
      `content/blog/${assetScope}/images/00000000-0000-4000-8000-000000000099.png`;
    expect(
      isContentImagePublicUrlOwnedBy(disabledConfig(), {
        assetScope,
        entity: "blog",
        publicUrl,
      }),
    ).toBe(false);
    expect(
      isContentImagePublicUrlOwnedBy(createFakeStorage().config, {
        assetScope: "scope",
        entity: "blog",
        publicUrl,
      }),
    ).toBe(false);
  });
});

describe("uploadContentAsset", () => {
  for (const [mimeType, extension] of [
    ["image/png", "png"],
    ["image/jpeg", "jpg"],
    ["image/webp", "webp"],
  ] as const) {
    it(`uploads ${mimeType} with an immutable UUID .${extension} name`, async () => {
      const { config, from, getPublicUrl, upload } = createFakeStorage();
      const result = await uploadContentAsset(config, {
        assetScope: assetScope.toUpperCase(),
        entity: "blog",
        file: createImageFile(`feature.card.${extension}`, mimeType),
      });

      expect(result).toEqual({
        ok: true,
        value: {
          alt: "feature.card",
          assetScope,
          entity: "blog",
          path: expect.stringMatching(
            new RegExp(
              `^content/blog/${assetScope}/images/[0-9a-f-]{36}\\.${extension}$`,
            ),
          ),
          publicUrl: expect.stringMatching(/^https:\/\//),
        },
      });
      expect(from).toHaveBeenCalledTimes(1);
      expect(from).toHaveBeenCalledWith("zerosourcing");
      expect(upload).toHaveBeenCalledWith(
        expect.stringMatching(
          new RegExp(
            `^content/blog/${assetScope}/images/[0-9a-f-]{36}\\.${extension}$`,
          ),
        ),
        expect.any(File),
        {
          cacheControl: "31536000",
          contentType: mimeType,
          upsert: false,
        },
      );
      expect(getPublicUrl).toHaveBeenCalledWith(upload.mock.calls[0]?.[0]);
    });
  }

  it("accepts the exact 10 MiB boundary", async () => {
    const { config, upload } = createFakeStorage();
    const result = await uploadContentAsset(config, {
      assetScope,
      entity: "portfolio",
      file: createImageFile(
        "boundary.webp",
        "image/webp",
        contentImageMaxSizeBytes,
      ),
    });

    expect(result.ok).toBe(true);
    expect(upload).toHaveBeenCalledTimes(1);
  });

  it("rejects unsupported MIME and oversized files before Storage", async () => {
    const unsupported = createFakeStorage();
    const unsupportedResult = await uploadContentAsset(unsupported.config, {
      assetScope,
      entity: "blog",
      file: createImageFile("animation.gif", "image/gif"),
    });
    const oversized = createFakeStorage();
    const oversizedResult = await uploadContentAsset(oversized.config, {
      assetScope,
      entity: "blog",
      file: createImageFile(
        "too-large.png",
        "image/png",
        contentImageMaxSizeBytes + 1,
      ),
    });

    expect(unsupportedResult).toEqual({
      error: expect.objectContaining({
        kind: "content_asset_validation",
        reason: "invalid_mime_type",
      }),
      ok: false,
    });
    expect(oversizedResult).toEqual({
      error: expect.objectContaining({
        kind: "content_asset_validation",
        reason: "file_too_large",
      }),
      ok: false,
    });
    expect(unsupported.from).not.toHaveBeenCalled();
    expect(oversized.from).not.toHaveBeenCalled();
  });

  it("rejects an invalid scope before Storage", async () => {
    const fake = createFakeStorage();
    const result = await uploadContentAsset(fake.config, {
      assetScope: "not-a-uuid",
      entity: "portfolio",
      file: createImageFile("feature.png", "image/png"),
    });

    expect(result).toEqual({
      error: expect.objectContaining({
        kind: "content_asset_validation",
        reason: "invalid_scope",
      }),
      ok: false,
    });
    expect(fake.from).not.toHaveBeenCalled();
  });

  it("rejects a Storage response that changes the exact object path", async () => {
    const foreignPath = `content/portfolio/${assetScope}/images/other.webp`;
    const fake = createFakeStorage({
      responsePath: foreignPath,
    });
    const result = await uploadContentAsset(fake.config, {
      assetScope,
      entity: "blog",
      file: createImageFile("feature.webp", "image/webp"),
    });

    expect(result).toEqual({
      error: expect.objectContaining({
        kind: "content_asset_validation",
        reason: "invalid_storage_path",
      }),
      ok: false,
    });
    expect(fake.getPublicUrl).not.toHaveBeenCalled();
    const requestedPath = fake.upload.mock.calls[0]?.[0];
    expect(requestedPath).toEqual(expect.any(String));
    expect(fake.remove).toHaveBeenCalledWith([requestedPath]);
    expect(fake.remove).not.toHaveBeenCalledWith([foreignPath]);
    expect(fake.events).toEqual([
      `upload:${requestedPath}`,
      `remove:${requestedPath}`,
    ]);
  });

  it("surfaces cleanup failure when post-upload compensation fails", async () => {
    const fake = createFakeStorage({
      removeError: new StorageApiError("Forbidden", 403, "Forbidden"),
      responsePath: `content/portfolio/${assetScope}/images/foreign.webp`,
    });
    const result = await uploadContentAsset(fake.config, {
      assetScope,
      entity: "blog",
      file: createImageFile("feature.webp", "image/webp"),
    });
    const requestedPath = fake.upload.mock.calls[0]?.[0];

    expect(result).toEqual({
      error: expect.objectContaining({
        kind: "content_asset_cleanup_failure",
        path: requestedPath,
      }),
      ok: false,
    });
    expect(fake.remove).toHaveBeenCalledWith([requestedPath]);
  });

  it("requires an allowed public URL for the exact configured Storage object", async () => {
    const insecure = createFakeStorage({
      publicUrl: "http://localhost:54321/storage/object.png",
    });
    const malformed = createFakeStorage({ publicUrl: "not a URL" });
    const wrongOrigin = createFakeStorage({
      publicUrl:
        `https://other.example/storage/v1/object/public/zerosourcing/` +
        `content/blog/${assetScope}/images/feature.png`,
    });
    const remoteHttp = createFakeStorage({
      configUrl: "http://project.supabase.co",
    });

    for (const fake of [insecure, malformed, wrongOrigin, remoteHttp]) {
      const result = await uploadContentAsset(fake.config, {
        assetScope,
        entity: "blog",
        file: createImageFile("feature.png", "image/png"),
      });
      expect(result).toEqual({
        error: expect.objectContaining({
          kind: "content_asset_validation",
          reason: "insecure_public_url",
        }),
        ok: false,
      });
      const requestedPath = fake.upload.mock.calls[0]?.[0];
      expect(fake.remove).toHaveBeenCalledWith([requestedPath]);
      expect(fake.events.at(-1)).toBe(`remove:${requestedPath}`);
    }
  });

  for (const loopbackUrl of [
    "http://localhost:54321",
    "http://127.42.0.7:54321",
    "http://[::1]:54321",
  ]) {
    it(`allows same-origin local Storage HTTP at ${loopbackUrl}`, async () => {
      const fake = createFakeStorage({ configUrl: loopbackUrl });
      const result = await uploadContentAsset(fake.config, {
        assetScope,
        entity: "portfolio",
        file: createImageFile("local.png", "image/png"),
      });

      expect(result).toEqual({
        ok: true,
        value: expect.objectContaining({
          publicUrl: expect.stringMatching(/^http:/),
        }),
      });
      expect(fake.remove).not.toHaveBeenCalled();
    });
  }

  it("maps returned and thrown 409 errors to immutable conflicts", async () => {
    const conflict = new StorageApiError("Duplicate", 409, "Duplicate");

    for (const fake of [
      createFakeStorage({ uploadError: conflict }),
      createFakeStorage({ uploadThrownError: conflict }),
    ]) {
      const result = await uploadContentAsset(fake.config, {
        assetScope,
        entity: "portfolio",
        file: createImageFile("feature.jpeg", "image/jpeg"),
      });
      expect(result).toEqual({
        error: expect.objectContaining({ kind: "content_asset_conflict" }),
        ok: false,
      });
      if (!result.ok) {
        expect(adminFailureMessage(result.error)).toBe(
          "같은 경로의 본문 asset이 이미 존재합니다. 새 경로를 사용해 주세요.",
        );
      }
    }
  });

  it("converts rejected Storage and public URL promises to typed failures", async () => {
    const rejectedUpload = createFakeStorage({
      uploadThrownError: new TypeError("fetch failed"),
    });
    const rejectedPublicUrl = createFakeStorage({
      publicUrlError: new TypeError("unexpected response"),
    });

    const uploadResult = await uploadContentAsset(rejectedUpload.config, {
      assetScope,
      entity: "blog",
      file: createImageFile("feature.png", "image/png"),
    });
    const publicUrlResult = await uploadContentAsset(rejectedPublicUrl.config, {
      assetScope,
      entity: "blog",
      file: createImageFile("feature.png", "image/png"),
    });

    expect(uploadResult).toEqual({
      error: expect.objectContaining({ kind: "network_failure" }),
      ok: false,
    });
    expect(publicUrlResult).toEqual({
      error: expect.objectContaining({ kind: "upload_failure" }),
      ok: false,
    });
    const requestedPath = rejectedPublicUrl.upload.mock.calls[0]?.[0];
    expect(rejectedPublicUrl.remove).toHaveBeenCalledWith([requestedPath]);
    expect(rejectedPublicUrl.events).toEqual([
      `upload:${requestedPath}`,
      `public-url:${requestedPath}`,
      `remove:${requestedPath}`,
    ]);
  });

  it("maps returned and thrown StorageUnknownError fetch failures to network", async () => {
    for (const fake of [
      createFakeStorage({ uploadError: createStorageUnknownError() }),
      createFakeStorage({ uploadThrownError: createStorageUnknownError() }),
    ]) {
      const result = await uploadContentAsset(fake.config, {
        assetScope,
        entity: "blog",
        file: createImageFile("feature.png", "image/png"),
      });

      expect(result).toEqual({
        error: expect.objectContaining({ kind: "network_failure" }),
        ok: false,
      });
    }
  });
});

describe("uploadRawHtmlAsset", () => {
  for (const [relativePath, mimeType] of [
    ["images/meetit-feature-01.png", "image/png"],
    ["images/photo.jpg", "image/jpeg"],
    ["images/photo.JPEG", "image/jpeg"],
    ["한글 이미지/기능.webp", "image/webp"],
  ] as const) {
    it(`preserves the exact raw path ${relativePath}`, async () => {
      const fake = createFakeStorage();
      const result = await uploadRawHtmlAsset(fake.config, {
        assetScope,
        entity: "portfolio",
        file: createImageFile(
          relativePath.split("/").at(-1) ?? "asset",
          mimeType,
        ),
        relativePath,
      });

      expect(result).toEqual({
        ok: true,
        value: {
          assetScope,
          entity: "portfolio",
          path: `content/portfolio/${assetScope}/${relativePath}`,
          publicUrl: expect.stringMatching(/^https:\/\//),
          relativePath,
        },
      });
      expect(fake.upload).toHaveBeenCalledWith(
        `content/portfolio/${assetScope}/${relativePath}`,
        expect.any(File),
        expect.objectContaining({ upsert: false }),
      );
    });
  }

  it("preserves Korean NFC and NFD paths without normalization", async () => {
    const nfcPath = "이미지/한글-기능.png";
    const nfdPath = nfcPath.normalize("NFD");
    expect(nfdPath).not.toBe(nfcPath);

    for (const relativePath of [nfcPath, nfdPath]) {
      const fake = createFakeStorage();
      const result = await uploadRawHtmlAsset(fake.config, {
        assetScope,
        entity: "blog",
        file: createImageFile("한글-기능.png", "image/png"),
        relativePath,
      });

      expect(result).toEqual({
        ok: true,
        value: expect.objectContaining({
          path: `content/blog/${assetScope}/${relativePath}`,
          relativePath,
        }),
      });
      expect(fake.upload).toHaveBeenCalledWith(
        `content/blog/${assetScope}/${relativePath}`,
        expect.any(File),
        expect.any(Object),
      );
    }
  });

  it.each([
    "",
    "/images/feature.png",
    "//cdn.example.com/feature.png",
    "https://cdn.example.com/feature.png",
    "images\\feature.png",
    "images/feature:2.png",
    "images/feature%20image.png",
    "images/feature.png?version=1",
    "images/feature.png#section",
    "images/control\u0000.png",
    "images/control\u0085.png",
    "images/lone-high-surrogate-\uD800.png",
    "images/lone-low-surrogate-\uDC00.png",
    "images//feature.png",
    "images/./feature.png",
    "images/../feature.png",
    "images/feature.png/",
    `images/${"a".repeat(129)}.png`,
    `${"a".repeat(110)}/${"b".repeat(110)}/${"c".repeat(110)}/${"d".repeat(110)}/${"e".repeat(110)}.png`,
  ])(
    "rejects unsafe or overlong raw path %j before Storage",
    async (relativePath) => {
      const fake = createFakeStorage();
      const result = await uploadRawHtmlAsset(fake.config, {
        assetScope,
        entity: "blog",
        file: createImageFile("feature.png", "image/png"),
        relativePath,
      });

      expect(result).toEqual({
        error: expect.objectContaining({
          kind: "content_asset_validation",
          reason: "invalid_relative_path",
        }),
        ok: false,
      });
      expect(fake.from).not.toHaveBeenCalled();
    },
  );

  it("rejects MIME-extension mismatch and size overflow before Storage", async () => {
    const mismatch = createFakeStorage();
    const mismatchResult = await uploadRawHtmlAsset(mismatch.config, {
      assetScope,
      entity: "blog",
      file: createImageFile("feature.png", "image/webp"),
      relativePath: "images/feature.png",
    });
    const oversized = createFakeStorage();
    const oversizedResult = await uploadRawHtmlAsset(oversized.config, {
      assetScope,
      entity: "blog",
      file: createImageFile(
        "feature.webp",
        "image/webp",
        contentImageMaxSizeBytes + 1,
      ),
      relativePath: "images/feature.webp",
    });

    expect(mismatchResult).toEqual({
      error: expect.objectContaining({
        kind: "content_asset_validation",
        reason: "mime_extension_mismatch",
      }),
      ok: false,
    });
    expect(oversizedResult).toEqual({
      error: expect.objectContaining({
        kind: "content_asset_validation",
        reason: "file_too_large",
      }),
      ok: false,
    });
    expect(mismatch.from).not.toHaveBeenCalled();
    expect(oversized.from).not.toHaveBeenCalled();
  });
});

describe("removeContentAsset", () => {
  const path = `content/blog/${assetScope}/images/00000000-0000-4000-8000-000000000002.webp`;

  it("removes one exact object under the matching entity and scope", async () => {
    const fake = createFakeStorage();
    const result = await removeContentAsset(fake.config, {
      assetScope: assetScope.toUpperCase(),
      entity: "blog",
      path,
    });

    expect(result).toEqual({ ok: true, value: null });
    expect(fake.from).toHaveBeenCalledWith("zerosourcing");
    expect(fake.remove).toHaveBeenCalledTimes(1);
    expect(fake.remove).toHaveBeenCalledWith([path]);
  });

  it.each([
    ["invalid scope", "not-a-uuid", path],
    ["scope prefix", assetScope, `content/blog/${assetScope}/`],
    [
      "different entity",
      assetScope,
      `content/portfolio/${assetScope}/images/file.webp`,
    ],
    [
      "different scope",
      assetScope,
      "content/blog/00000000-0000-4000-8000-000000000099/images/file.webp",
    ],
    ["traversal", assetScope, `content/blog/${assetScope}/images/../file.webp`],
  ])(
    "rejects %s removal before Storage",
    async (_label, scopeValue, pathValue) => {
      const fake = createFakeStorage();
      const result = await removeContentAsset(fake.config, {
        assetScope: scopeValue,
        entity: "blog",
        path: pathValue,
      });

      expect(result).toEqual({
        error: expect.objectContaining({
          kind: "content_asset_validation",
        }),
        ok: false,
      });
      expect(fake.from).not.toHaveBeenCalled();
    },
  );

  it("maps a delete failure to a cleanup-specific result", async () => {
    const fake = createFakeStorage({
      removeError: new StorageApiError("Not found", 404, "NotFound"),
    });
    const result = await removeContentAsset(fake.config, {
      assetScope,
      entity: "blog",
      path,
    });

    expect(result).toEqual({
      error: expect.objectContaining({
        kind: "content_asset_cleanup_failure",
        path,
      }),
      ok: false,
    });
    if (!result.ok) {
      expect(adminFailureMessage(result.error)).toBe(
        "업로드된 본문 asset을 정리하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      );
    }
  });

  it("converts rejected delete promises and maps cleanup 409 to cleanup failure", async () => {
    const rejected = createFakeStorage({
      removeThrownError: new TypeError("fetch failed"),
    });
    const conflicted = createFakeStorage({
      removeThrownError: new StorageApiError("Conflict", 409, "Conflict"),
    });

    const rejectedResult = await removeContentAsset(rejected.config, {
      assetScope,
      entity: "blog",
      path,
    });
    const conflictResult = await removeContentAsset(conflicted.config, {
      assetScope,
      entity: "blog",
      path,
    });

    expect(rejectedResult).toEqual({
      error: expect.objectContaining({
        kind: "content_asset_cleanup_failure",
      }),
      ok: false,
    });
    expect(conflictResult).toEqual({
      error: expect.objectContaining({
        kind: "content_asset_cleanup_failure",
        path,
      }),
      ok: false,
    });
  });

  it("maps a returned StorageUnknownError cleanup response to network failure", async () => {
    const fake = createFakeStorage({
      removeError: createStorageUnknownError(),
    });
    const result = await removeContentAsset(fake.config, {
      assetScope,
      entity: "blog",
      path,
    });

    expect(result).toEqual({
      error: expect.objectContaining({ kind: "network_failure" }),
      ok: false,
    });
  });
});
