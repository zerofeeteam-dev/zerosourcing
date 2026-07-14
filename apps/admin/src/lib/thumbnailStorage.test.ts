import { CONTENT_STORAGE_BUCKET } from "@repo/content/asset-url";
import { StorageApiError } from "@supabase/supabase-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  adminFailureMessage,
  authExpiredFailure,
  duplicateSlugFailure,
  networkFailure,
  permissionDeniedFailure,
  saveFailure,
  thumbnailCleanupFailure,
} from "./adminErrors";
import {
  persistThumbnailChange,
  type ThumbnailReference,
} from "./thumbnailPersistence";
import { adminErr, adminOk } from "./adminTypes";
import type {
  AdminSlug,
  AdminThumbnailFile,
  AdminThumbnailMimeType,
} from "./adminTypes";
import { adminThumbnailMaxSizeBytes } from "./adminValidation";
import type { SupabaseConfig } from "./supabase";
import {
  removeBlogThumbnail,
  removeThumbnail,
  uploadBlogThumbnail,
  uploadThumbnail,
} from "./thumbnailStorage";

const fixedUuid = "00000000-0000-4000-8000-000000000123";
const oldUuid = "00000000-0000-4000-8000-000000000456";
const slug = { value: "managed-content" } satisfies AdminSlug;
const oldPath = `${slug.value}/${oldUuid}.jpg`;

type FakeStorageOptions = {
  readonly configUrl?: string;
  readonly getPublicUrlError?: unknown;
  readonly publicUrl?: string;
  readonly removeError?: unknown;
  readonly removeThrownError?: unknown;
  readonly responsePath?: string;
  readonly uploadResponse?: {
    readonly value: unknown;
  };
  readonly uploadError?: unknown;
  readonly uploadThrownError?: unknown;
};

function createThumbnail(
  mimeType: AdminThumbnailMimeType = "image/webp",
  sizeBytes = 4,
): AdminThumbnailFile {
  const extension = mimeType === "image/jpeg" ? "jpg" : mimeType.split("/")[1];
  const file = new File(["data"], `thumbnail.${extension}`, { type: mimeType });
  Object.defineProperty(file, "size", {
    configurable: true,
    value: sizeBytes,
  });
  return { file, mimeType, sizeBytes };
}

function createStorageUnknownError(): Error {
  return Object.assign(new Error("fetch failed"), {
    name: "StorageUnknownError",
    originalError: new TypeError("fetch failed"),
    status: undefined,
    statusCode: undefined,
  });
}

function createFakeStorage(options: FakeStorageOptions = {}) {
  const configUrl = options.configUrl ?? "https://project.supabase.co";
  const events: string[] = [];
  const upload = vi.fn(async (path: string) => {
    events.push(`upload:${path}`);
    if (options.uploadThrownError) throw options.uploadThrownError;
    if (options.uploadResponse) return options.uploadResponse.value;
    if (options.uploadError) return { data: null, error: options.uploadError };
    return {
      data: { path: options.responsePath ?? path },
      error: null,
    };
  });
  const getPublicUrl = vi.fn((path: string) => {
    events.push(`public-url:${path}`);
    if (options.getPublicUrlError) throw options.getPublicUrlError;
    return {
      data: {
        publicUrl:
          options.publicUrl ??
          `${configUrl}/storage/v1/object/public/${CONTENT_STORAGE_BUCKET}/${path}`,
      },
    };
  });
  const remove = vi.fn(async (paths: readonly string[]) => {
    events.push(`remove:${paths.join(",")}`);
    if (options.removeThrownError) throw options.removeThrownError;
    if (options.removeError) return { data: null, error: options.removeError };
    return { data: [], error: null };
  });
  const bucket = { getPublicUrl, remove, upload };
  const from = vi.fn(() => bucket);
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

function useFixedUuid(): void {
  vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue(fixedUuid);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("thumbnail storage", () => {
  it.each([
    ["image/png", "png"],
    ["image/jpeg", "jpg"],
    ["image/webp", "webp"],
  ] as const)(
    "uploads %s to the fixed bucket with immutable options",
    async (mimeType, extension) => {
      useFixedUuid();
      const fake = createFakeStorage();
      const thumbnail = createThumbnail(mimeType);
      const result = await uploadThumbnail(fake.config, { slug, thumbnail });
      const expectedPath = `${slug.value}/${fixedUuid}.${extension}`;

      expect(result).toEqual({
        ok: true,
        value: {
          path: expectedPath,
          publicUrl:
            `https://project.supabase.co/storage/v1/object/public/` +
            `${CONTENT_STORAGE_BUCKET}/${expectedPath}`,
        },
      });
      expect(fake.from).toHaveBeenCalledTimes(1);
      expect(fake.from).toHaveBeenCalledWith(CONTENT_STORAGE_BUCKET);
      expect(fake.upload).toHaveBeenCalledWith(expectedPath, thumbnail.file, {
        cacheControl: "31536000",
        contentType: mimeType,
        upsert: false,
      });
      expect(fake.getPublicUrl).toHaveBeenCalledWith(expectedPath);
    },
  );

  it("keeps the legacy Blog aliases compatible", () => {
    expect(uploadBlogThumbnail).toBe(uploadThumbnail);
    expect(removeBlogThumbnail).toBe(removeThumbnail);
  });

  it("accepts the exact thumbnail size limit", async () => {
    useFixedUuid();
    const fake = createFakeStorage();
    const result = await uploadThumbnail(fake.config, {
      slug,
      thumbnail: createThumbnail("image/png", adminThumbnailMaxSizeBytes),
    });

    expect(result.ok).toBe(true);
    expect(fake.upload).toHaveBeenCalledTimes(1);
  });

  it("rejects invalid slug, MIME metadata, and oversized files before Storage", async () => {
    const invalidSlug = createFakeStorage();
    const invalidSlugResult = await uploadThumbnail(invalidSlug.config, {
      slug: { value: "content/blog" },
      thumbnail: createThumbnail(),
    });
    const invalidMime = createFakeStorage();
    const gif = new File(["data"], "thumbnail.gif", { type: "image/gif" });
    const invalidMimeResult = await uploadThumbnail(invalidMime.config, {
      slug,
      thumbnail: {
        file: gif,
        mimeType: "image/gif",
        sizeBytes: gif.size,
      } as unknown as AdminThumbnailFile,
    });
    const mismatchedMime = createFakeStorage();
    const mismatchedMimeResult = await uploadThumbnail(mismatchedMime.config, {
      slug,
      thumbnail: {
        ...createThumbnail("image/png"),
        mimeType: "image/webp",
      },
    });
    const oversized = createFakeStorage();
    const oversizedResult = await uploadThumbnail(oversized.config, {
      slug,
      thumbnail: createThumbnail("image/webp", adminThumbnailMaxSizeBytes + 1),
    });

    for (const result of [
      invalidSlugResult,
      invalidMimeResult,
      mismatchedMimeResult,
      oversizedResult,
    ]) {
      expect(result).toEqual({
        error: expect.objectContaining({ kind: "upload_failure" }),
        ok: false,
      });
    }
    expect(invalidSlug.from).not.toHaveBeenCalled();
    expect(invalidMime.from).not.toHaveBeenCalled();
    expect(mismatchedMime.from).not.toHaveBeenCalled();
    expect(oversized.from).not.toHaveBeenCalled();
  });

  it("preserves disabled configuration failures without touching Storage", async () => {
    const upload = await uploadThumbnail(disabledConfig(), {
      slug,
      thumbnail: createThumbnail(),
    });
    const remove = await removeThumbnail(disabledConfig(), oldPath);

    expect(upload).toEqual({
      error: expect.objectContaining({ kind: "supabase_disabled" }),
      ok: false,
    });
    expect(remove).toEqual({
      error: expect.objectContaining({ kind: "supabase_disabled" }),
      ok: false,
    });
  });

  it.each([
    [401, "auth_expired"],
    [403, "permission_denied"],
    [409, "upload_failure"],
    [500, "network_failure"],
  ] as const)("maps Storage status %s to %s", async (status, kind) => {
    useFixedUuid();
    const fake = createFakeStorage({
      uploadError: new StorageApiError("Storage failed", status, "failed"),
    });
    const result = await uploadThumbnail(fake.config, {
      slug,
      thumbnail: createThumbnail(),
    });

    expect(result).toEqual({
      error: expect.objectContaining({ kind }),
      ok: false,
    });
  });

  it("maps thrown fetch failures to network and public URL failures to upload", async () => {
    useFixedUuid();
    const network = createFakeStorage({
      uploadThrownError: new TypeError("fetch failed"),
    });
    const publicUrl = createFakeStorage({
      getPublicUrlError: new Error("invalid public URL response"),
    });

    const networkResult = await uploadThumbnail(network.config, {
      slug,
      thumbnail: createThumbnail(),
    });
    const publicUrlResult = await uploadThumbnail(publicUrl.config, {
      slug,
      thumbnail: createThumbnail(),
    });

    expect(networkResult).toEqual({
      error: expect.objectContaining({ kind: "network_failure" }),
      ok: false,
    });
    expect(publicUrlResult).toEqual({
      error: expect.objectContaining({ kind: "upload_failure" }),
      ok: false,
    });
    expect(publicUrl.remove).toHaveBeenCalledWith([
      `${slug.value}/${fixedUuid}.webp`,
    ]);
  });

  it("rejects mismatched paths and unsafe public URLs with exact-object compensation", async () => {
    useFixedUuid();
    const requestedPath = `${slug.value}/${fixedUuid}.webp`;
    const foreignPath = `other/${fixedUuid}.webp`;
    const mismatchedPath = createFakeStorage({ responsePath: foreignPath });
    const wrongOrigin = createFakeStorage({
      publicUrl:
        `https://other.example/storage/v1/object/public/` +
        `${CONTENT_STORAGE_BUCKET}/${requestedPath}`,
    });
    const remoteHttp = createFakeStorage({
      configUrl: "http://project.supabase.co",
    });

    for (const fake of [mismatchedPath, wrongOrigin, remoteHttp]) {
      const result = await uploadThumbnail(fake.config, {
        slug,
        thumbnail: createThumbnail(),
      });

      expect(result).toEqual({
        error: expect.objectContaining({ kind: "upload_failure" }),
        ok: false,
      });
      expect(fake.remove).toHaveBeenCalledWith([requestedPath]);
      expect(fake.remove).not.toHaveBeenCalledWith([foreignPath]);
      expect(fake.events.at(-1)).toBe(`remove:${requestedPath}`);
    }
  });

  it.each([
    "http://localhost:54321",
    "http://127.42.0.7:54321",
    "http://[::1]:54321",
  ])(
    "accepts exact same-origin loopback public URLs at %s",
    async (configUrl) => {
      useFixedUuid();
      const fake = createFakeStorage({ configUrl });
      const result = await uploadThumbnail(fake.config, {
        slug,
        thumbnail: createThumbnail(),
      });

      expect(result).toEqual({
        ok: true,
        value: expect.objectContaining({
          publicUrl: expect.stringMatching(/^http:/u),
        }),
      });
      expect(fake.remove).not.toHaveBeenCalled();
    },
  );

  it("surfaces compensation failure after an invalid Storage response", async () => {
    useFixedUuid();
    const fake = createFakeStorage({
      removeError: new StorageApiError("Forbidden", 403, "Forbidden"),
      responsePath: `other/${fixedUuid}.webp`,
    });
    const result = await uploadThumbnail(fake.config, {
      slug,
      thumbnail: createThumbnail(),
    });

    expect(result).toEqual({
      error: expect.objectContaining({
        kind: "thumbnail_cleanup_failure",
        path: `${slug.value}/${fixedUuid}.webp`,
      }),
      ok: false,
    });
  });

  it.each([
    { data: null, error: null },
    undefined,
    { data: {}, error: null },
    { data: { path: 42 }, error: null },
  ])("compensates a malformed upload response %#", async (response) => {
    useFixedUuid();
    const fake = createFakeStorage({
      uploadResponse: { value: response },
    });
    const requestedPath = `${slug.value}/${fixedUuid}.webp`;
    const result = await uploadThumbnail(fake.config, {
      slug,
      thumbnail: createThumbnail(),
    });

    expect(result).toEqual({
      error: expect.objectContaining({ kind: "upload_failure" }),
      ok: false,
    });
    expect(fake.events).toEqual([
      `upload:${requestedPath}`,
      `remove:${requestedPath}`,
    ]);
    expect(fake.remove).toHaveBeenCalledWith([requestedPath]);
    expect(fake.getPublicUrl).not.toHaveBeenCalled();
  });

  it("prioritizes thumbnail cleanup failure for malformed-response compensation", async () => {
    useFixedUuid();
    const requestedPath = `${slug.value}/${fixedUuid}.webp`;
    const fake = createFakeStorage({
      removeThrownError: new StorageApiError("Conflict", 409, "Conflict"),
      uploadResponse: { value: undefined },
    });
    const result = await uploadThumbnail(fake.config, {
      slug,
      thumbnail: createThumbnail(),
    });

    expect(result).toEqual({
      error: thumbnailCleanupFailure(requestedPath),
      ok: false,
    });
    if (!result.ok) {
      expect(adminFailureMessage(result.error)).toBe(
        "업로드된 썸네일을 정리하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      );
    }
  });

  it("contains throwing response accessors and compensates without leaking", async () => {
    useFixedUuid();
    const errorGetter = Object.defineProperty({}, "error", {
      get() {
        throw new Error("error getter failed");
      },
    });
    const dataGetter = Object.defineProperty({ error: null }, "data", {
      get() {
        throw new Error("data getter failed");
      },
    });
    const pathGetter = Object.defineProperty({}, "path", {
      get() {
        throw new Error("path getter failed");
      },
    });
    const requestedPath = `${slug.value}/${fixedUuid}.webp`;

    for (const response of [
      errorGetter,
      dataGetter,
      { data: pathGetter, error: null },
    ]) {
      const fake = createFakeStorage({
        uploadResponse: { value: response },
      });
      const result = await uploadThumbnail(fake.config, {
        slug,
        thumbnail: createThumbnail(),
      });

      expect(result).toEqual({
        error: expect.objectContaining({ kind: "upload_failure" }),
        ok: false,
      });
      expect(fake.events).toEqual([
        `upload:${requestedPath}`,
        `remove:${requestedPath}`,
      ]);
    }
  });

  it("removes only one-level legacy thumbnail paths from the fixed bucket", async () => {
    const fake = createFakeStorage();
    const result = await removeThumbnail(fake.config, oldPath);

    expect(result).toEqual({ ok: true, value: null });
    expect(fake.from).toHaveBeenCalledTimes(1);
    expect(fake.from).toHaveBeenCalledWith(CONTENT_STORAGE_BUCKET);
    expect(fake.remove).toHaveBeenCalledWith([oldPath]);
  });

  it.each([
    `content/blog/${fixedUuid}/images/${oldUuid}.webp`,
    `content/portfolio/${fixedUuid}/images/${oldUuid}.png`,
    `${slug.value}/nested/${oldUuid}.png`,
    `${slug.value}/not-a-uuid.png`,
    `${slug.value}/${oldUuid}.jpeg`,
    `../${slug.value}/${oldUuid}.jpg`,
    `${slug.value}/%2e%2e/${oldUuid}.jpg`,
    `${slug.value}%2f${oldUuid}.jpg`,
    `${slug.value}\u2215${oldUuid}.jpg`,
    `${slug.value}\u2044${oldUuid}.jpg`,
    `${slug.value}\uff0f${oldUuid}.jpg`,
    `${slug.value}\u0000/${oldUuid}.jpg`,
    `${slug.value}\u001f/${oldUuid}.jpg`,
    `${slug.value}\u0085/${oldUuid}.jpg`,
    `${slug.value}\u009f/${oldUuid}.jpg`,
    `${slug.value}\ud800/${oldUuid}.jpg`,
    `${slug.value}\udc00/${oldUuid}.jpg`,
  ])("rejects non-legacy removal path %s before Storage", async (path) => {
    const fake = createFakeStorage();
    const result = await removeThumbnail(fake.config, path);

    expect(result).toEqual({
      error: expect.objectContaining({ kind: "thumbnail_cleanup_failure" }),
      ok: false,
    });
    expect(fake.from).not.toHaveBeenCalled();
    expect(fake.remove).not.toHaveBeenCalled();
  });

  it("keeps the legacy blank-path no-op", async () => {
    const fake = createFakeStorage();

    expect(await removeThumbnail(fake.config, "   ")).toEqual({
      ok: true,
      value: null,
    });
    expect(fake.from).not.toHaveBeenCalled();
  });

  it("maps remove authorization and network failures", async () => {
    const denied = createFakeStorage({
      removeError: new StorageApiError("Forbidden", 403, "Forbidden"),
    });
    const network = createFakeStorage({
      removeThrownError: new TypeError("fetch failed"),
    });

    expect(await removeThumbnail(denied.config, oldPath)).toEqual({
      error: permissionDeniedFailure(),
      ok: false,
    });
    expect(await removeThumbnail(network.config, oldPath)).toEqual({
      error: networkFailure(),
      ok: false,
    });
  });

  it("maps returned and thrown cleanup 4xx responses to thumbnail cleanup failure", async () => {
    for (const status of [400, 409, 422]) {
      for (const fake of [
        createFakeStorage({
          removeError: new StorageApiError("Cleanup failed", status, "failed"),
        }),
        createFakeStorage({
          removeThrownError: new StorageApiError(
            "Cleanup failed",
            status,
            "failed",
          ),
        }),
      ]) {
        const result = await removeThumbnail(fake.config, oldPath);
        expect(result).toEqual({
          error: thumbnailCleanupFailure(oldPath),
          ok: false,
        });
        if (!result.ok) {
          expect(adminFailureMessage(result.error)).toBe(
            "업로드된 썸네일을 정리하지 못했습니다. 잠시 후 다시 시도해 주세요.",
          );
        }
      }
    }
  });

  it("maps returned and thrown StorageUnknownError to network for both operations", async () => {
    useFixedUuid();
    for (const fake of [
      createFakeStorage({ uploadError: createStorageUnknownError() }),
      createFakeStorage({
        uploadThrownError: createStorageUnknownError(),
      }),
    ]) {
      expect(
        await uploadThumbnail(fake.config, {
          slug,
          thumbnail: createThumbnail(),
        }),
      ).toEqual({ error: networkFailure(), ok: false });
    }

    for (const fake of [
      createFakeStorage({ removeError: createStorageUnknownError() }),
      createFakeStorage({
        removeThrownError: createStorageUnknownError(),
      }),
    ]) {
      expect(await removeThumbnail(fake.config, oldPath)).toEqual({
        error: networkFailure(),
        ok: false,
      });
    }
  });
});

describe("persistThumbnailChange", () => {
  const current = {
    path: oldPath,
    publicUrl: `https://project.supabase.co/${oldPath}`,
  } satisfies ThumbnailReference;

  it("uploads, saves, then removes the replaced thumbnail in that order", async () => {
    useFixedUuid();
    const fake = createFakeStorage();
    const newPath = `${slug.value}/${fixedUuid}.webp`;
    const outcome = await persistThumbnailChange({
      config: fake.config,
      current,
      removed: false,
      save: async (next) => {
        fake.events.push(`save:${next.path}`);
        expect(next).toEqual({
          path: newPath,
          publicUrl:
            `https://project.supabase.co/storage/v1/object/public/` +
            `${CONTENT_STORAGE_BUCKET}/${newPath}`,
        });
        return adminOk({ id: "saved" });
      },
      selected: createThumbnail(),
      slug,
    });

    expect(outcome).toEqual({
      cleanupIssues: [],
      result: { ok: true, value: { id: "saved" } },
    });
    expect(fake.events).toEqual([
      `upload:${newPath}`,
      `public-url:${newPath}`,
      `save:${newPath}`,
      `remove:${oldPath}`,
    ]);
  });

  it("saves an empty reference before clearing the old thumbnail", async () => {
    const fake = createFakeStorage();
    const outcome = await persistThumbnailChange({
      config: fake.config,
      current,
      removed: true,
      save: async (next) => {
        fake.events.push(`save:${String(next.path)}`);
        expect(next).toEqual({ path: null, publicUrl: null });
        return adminOk("saved");
      },
      slug,
    });

    expect(outcome.result).toEqual({ ok: true, value: "saved" });
    expect(outcome.cleanupIssues).toEqual([]);
    expect(fake.events).toEqual(["save:null", `remove:${oldPath}`]);
  });

  it("retains the old thumbnail when a clear-only save fails", async () => {
    const fake = createFakeStorage();
    const failure = duplicateSlugFailure(slug);
    const outcome = await persistThumbnailChange({
      config: fake.config,
      current,
      removed: true,
      save: async (next) => {
        fake.events.push(`save:${String(next.path)}`);
        return adminErr(failure);
      },
      slug,
    });

    expect(outcome.result).toEqual({ error: failure, ok: false });
    expect(outcome.cleanupIssues).toEqual([]);
    expect(fake.events).toEqual(["save:null"]);
    expect(fake.remove).not.toHaveBeenCalled();
  });

  it("saves the current reference without any Storage operation when unchanged", async () => {
    const fake = createFakeStorage();
    const outcome = await persistThumbnailChange({
      config: fake.config,
      current,
      removed: false,
      save: async (next) => {
        fake.events.push(`save:${next.path}`);
        expect(next).toBe(current);
        return adminOk("saved");
      },
      slug,
    });

    expect(outcome.result.ok).toBe(true);
    expect(fake.events).toEqual([`save:${oldPath}`]);
    expect(fake.from).not.toHaveBeenCalled();
  });

  it("rolls a new upload back only after a definite row-save rejection", async () => {
    useFixedUuid();
    const fake = createFakeStorage();
    const newPath = `${slug.value}/${fixedUuid}.webp`;
    const failure = duplicateSlugFailure(slug);
    const outcome = await persistThumbnailChange({
      config: fake.config,
      current,
      removed: false,
      save: async (next) => {
        fake.events.push(`save:${next.path}`);
        return adminErr(failure);
      },
      selected: createThumbnail(),
      slug,
    });

    expect(outcome.result).toEqual({ error: failure, ok: false });
    expect(outcome.cleanupIssues).toEqual([]);
    expect(fake.events).toEqual([
      `upload:${newPath}`,
      `public-url:${newPath}`,
      `save:${newPath}`,
      `remove:${newPath}`,
    ]);
    expect(fake.remove).not.toHaveBeenCalledWith([oldPath]);
  });

  it.each([networkFailure(), saveFailure()])(
    "retains a new upload after indeterminate %s",
    async (failure) => {
      useFixedUuid();
      const fake = createFakeStorage();
      const newPath = `${slug.value}/${fixedUuid}.webp`;
      const outcome = await persistThumbnailChange({
        config: fake.config,
        current,
        removed: false,
        save: async (next) => {
          fake.events.push(`save:${next.path}`);
          return adminErr(failure);
        },
        selected: createThumbnail(),
        slug,
      });

      expect(outcome.result).toEqual({ error: failure, ok: false });
      expect(outcome.cleanupIssues).toEqual([]);
      expect(fake.events).toEqual([
        `upload:${newPath}`,
        `public-url:${newPath}`,
        `save:${newPath}`,
      ]);
      expect(fake.remove).not.toHaveBeenCalled();
    },
  );

  it("keeps the save failure primary and reports rollback cleanup failure separately", async () => {
    useFixedUuid();
    const cleanupFailure = new StorageApiError("Forbidden", 403, "Forbidden");
    const fake = createFakeStorage({ removeError: cleanupFailure });
    const failure = duplicateSlugFailure(slug);
    const newPath = `${slug.value}/${fixedUuid}.webp`;
    const outcome = await persistThumbnailChange({
      config: fake.config,
      current,
      removed: false,
      save: async () => adminErr(failure),
      selected: createThumbnail(),
      slug,
    });

    expect(outcome.result).toEqual({ error: failure, ok: false });
    expect(outcome.cleanupIssues).toEqual([
      {
        failure: permissionDeniedFailure(),
        path: newPath,
        stage: "rollback_new_upload",
      },
    ]);
    expect(fake.remove).toHaveBeenCalledWith([newPath]);
  });

  it("keeps row-save success and reports old-thumbnail cleanup failure separately", async () => {
    useFixedUuid();
    const fake = createFakeStorage({
      removeError: new StorageApiError("Forbidden", 403, "Forbidden"),
    });
    const outcome = await persistThumbnailChange({
      config: fake.config,
      current,
      removed: false,
      save: async () => adminOk({ id: "saved" }),
      selected: createThumbnail(),
      slug,
    });

    expect(outcome.result).toEqual({
      ok: true,
      value: { id: "saved" },
    });
    expect(outcome.cleanupIssues).toEqual([
      {
        failure: permissionDeniedFailure(),
        path: oldPath,
        stage: "remove_replaced_upload",
      },
    ]);
    expect(fake.remove).toHaveBeenCalledWith([oldPath]);
  });

  it("never deletes when Storage returns the same path as the current reference", async () => {
    useFixedUuid();
    const samePath = `${slug.value}/${fixedUuid}.webp`;
    const fake = createFakeStorage();
    const outcome = await persistThumbnailChange({
      config: fake.config,
      current: {
        path: samePath,
        publicUrl: `https://project.supabase.co/${samePath}`,
      },
      removed: false,
      save: async (next) => {
        fake.events.push(`save:${next.path}`);
        return adminOk("saved");
      },
      selected: createThumbnail(),
      slug,
    });

    expect(outcome.result.ok).toBe(true);
    expect(outcome.cleanupIssues).toEqual([]);
    expect(fake.events).toEqual([
      `upload:${samePath}`,
      `public-url:${samePath}`,
      `save:${samePath}`,
    ]);
    expect(fake.remove).not.toHaveBeenCalled();
  });

  it("retains a same-path upload when the row save is definitely rejected", async () => {
    useFixedUuid();
    const samePath = `${slug.value}/${fixedUuid}.webp`;
    const fake = createFakeStorage();
    const failure = duplicateSlugFailure(slug);
    const outcome = await persistThumbnailChange({
      config: fake.config,
      current: {
        path: samePath,
        publicUrl: `https://project.supabase.co/${samePath}`,
      },
      removed: false,
      save: async (next) => {
        fake.events.push(`save:${next.path}`);
        return adminErr(failure);
      },
      selected: createThumbnail(),
      slug,
    });

    expect(outcome.result).toEqual({ error: failure, ok: false });
    expect(outcome.cleanupIssues).toEqual([]);
    expect(fake.events).toEqual([
      `upload:${samePath}`,
      `public-url:${samePath}`,
      `save:${samePath}`,
    ]);
    expect(fake.remove).not.toHaveBeenCalled();
  });

  it("does not save when the new upload fails", async () => {
    useFixedUuid();
    const fake = createFakeStorage({
      uploadError: new StorageApiError("Unauthorized", 401, "Unauthorized"),
    });
    const save = vi.fn(async () => adminOk("saved"));
    const outcome = await persistThumbnailChange({
      config: fake.config,
      current,
      removed: false,
      save,
      selected: createThumbnail(),
      slug,
    });

    expect(outcome.result).toEqual({
      error: authExpiredFailure(),
      ok: false,
    });
    expect(outcome.cleanupIssues).toEqual([]);
    expect(save).not.toHaveBeenCalled();
    expect(fake.remove).not.toHaveBeenCalled();
  });
});
