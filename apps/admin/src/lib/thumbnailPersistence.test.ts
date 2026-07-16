import { CONTENT_STORAGE_BUCKET } from "@repo/content/asset-url";
import { afterEach, describe, expect, it, vi } from "vitest";
import { saveFailure, type AdminFailure } from "./adminErrors";
import {
  persistThumbnailChange,
  type ThumbnailReference,
} from "./thumbnailPersistence";
import { adminErr, adminOk } from "./adminTypes";
import type { AdminSlug, AdminThumbnailFile } from "./adminTypes";
import type { SupabaseConfig } from "./supabase";

const fixedUuid = "00000000-0000-4000-8000-000000000789";
const oldUuid = "00000000-0000-4000-8000-000000000987";
const slug = { value: "persistence-edge" } satisfies AdminSlug;

function thumbnail(): AdminThumbnailFile {
  const file = new File(["data"], "thumbnail.webp", {
    type: "image/webp",
  });
  return { file, mimeType: "image/webp", sizeBytes: file.size };
}

function fakeStorage() {
  const events: string[] = [];
  const upload = vi.fn(async (path: string) => {
    events.push(`upload:${path}`);
    return { data: { path }, error: null };
  });
  const getPublicUrl = vi.fn((path: string) => {
    events.push(`public-url:${path}`);
    return {
      data: {
        publicUrl:
          `https://project.supabase.co/storage/v1/object/public/` +
          `${CONTENT_STORAGE_BUCKET}/${path}`,
      },
    };
  });
  const remove = vi.fn(async (paths: readonly string[]) => {
    events.push(`remove:${paths.join(",")}`);
    return { data: [], error: null };
  });
  const from = vi.fn(() => ({ getPublicUrl, remove, upload }));
  const config = {
    client: { storage: { from } },
    kind: "enabled",
    url: "https://project.supabase.co",
  } as unknown as SupabaseConfig;

  return { config, events, from, remove };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("persistThumbnailChange edge contracts", () => {
  it("uploads and saves a secondary image in the same row write", async () => {
    vi.spyOn(globalThis.crypto, "randomUUID")
      .mockReturnValueOnce(fixedUuid)
      .mockReturnValueOnce(oldUuid);
    const fake = fakeStorage();
    const thumbnailPath = `${slug.value}/${fixedUuid}.webp`;
    const bannerPath = `${slug.value}/${oldUuid}.webp`;
    const save = vi.fn(
      async (next: ThumbnailReference, secondaryNext?: ThumbnailReference) => {
        expect(next.path).toBe(thumbnailPath);
        expect(secondaryNext?.path).toBe(bannerPath);
        return adminOk("saved");
      },
    );

    const outcome = await persistThumbnailChange({
      config: fake.config,
      current: { path: null, publicUrl: null },
      removed: false,
      save,
      secondary: {
        current: { path: null, publicUrl: null },
        removed: false,
        selected: thumbnail(),
      },
      selected: thumbnail(),
      slug,
    });

    expect(outcome.result).toEqual({ ok: true, value: "saved" });
    expect(outcome.cleanupIssues).toEqual([]);
    expect(save).toHaveBeenCalledTimes(1);
    expect(fake.events).toEqual([
      `upload:${thumbnailPath}`,
      `public-url:${thumbnailPath}`,
      `upload:${bannerPath}`,
      `public-url:${bannerPath}`,
    ]);
  });

  it("lets an explicit selection win over a stale removed flag", async () => {
    vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue(fixedUuid);
    const fake = fakeStorage();
    const oldPath = `${slug.value}/${oldUuid}.jpg`;
    const newPath = `${slug.value}/${fixedUuid}.webp`;
    const outcome = await persistThumbnailChange({
      config: fake.config,
      current: {
        path: oldPath,
        publicUrl: `https://project.supabase.co/${oldPath}`,
      },
      removed: true,
      save: async (next) => {
        fake.events.push(`save:${next.path}`);
        expect(next.path).toBe(newPath);
        return adminOk("saved");
      },
      selected: thumbnail(),
      slug,
    });

    expect(outcome.result).toEqual({ ok: true, value: "saved" });
    expect(outcome.cleanupIssues).toEqual([]);
    expect(fake.events).toEqual([
      `upload:${newPath}`,
      `public-url:${newPath}`,
      `save:${newPath}`,
      `remove:${oldPath}`,
    ]);
  });

  it("reports a reserved current path without ever passing it to Storage", async () => {
    const fake = fakeStorage();
    const reservedPath = `content/blog/${fixedUuid}/images/${oldUuid}.webp`;
    const outcome = await persistThumbnailChange({
      config: fake.config,
      current: {
        path: reservedPath,
        publicUrl: `https://project.supabase.co/${reservedPath}`,
      },
      removed: true,
      save: async (next) => {
        fake.events.push(`save:${String(next.path)}`);
        return adminOk("saved");
      },
      slug,
    });

    expect(outcome.result).toEqual({ ok: true, value: "saved" });
    expect(outcome.cleanupIssues).toEqual([
      {
        failure: expect.objectContaining({
          kind: "thumbnail_cleanup_failure",
        }),
        path: reservedPath,
        stage: "remove_replaced_upload",
      },
    ]);
    expect(fake.events).toEqual(["save:null"]);
    expect(fake.from).not.toHaveBeenCalled();
    expect(fake.remove).not.toHaveBeenCalled();
  });

  it("retains a new upload for an unknown future row-write failure", async () => {
    vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue(fixedUuid);
    const fake = fakeStorage();
    const failure = {
      kind: "future_write_failure",
      message: "The server response is indeterminate.",
    } as unknown as AdminFailure;
    const outcome = await persistThumbnailChange({
      config: fake.config,
      current: { path: null, publicUrl: null },
      removed: false,
      save: async () => adminErr(failure),
      selected: thumbnail(),
      slug,
    });

    expect(outcome.result).toEqual({ error: failure, ok: false });
    expect(outcome.cleanupIssues).toEqual([]);
    expect(fake.remove).not.toHaveBeenCalled();
  });

  it("types a rejected save adapter as indeterminate and retains the upload", async () => {
    vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue(fixedUuid);
    const fake = fakeStorage();
    const saveError = new Error("unexpected adapter failure");
    const outcome = await persistThumbnailChange({
      config: fake.config,
      current: { path: null, publicUrl: null },
      removed: false,
      save: async () => {
        throw saveError;
      },
      selected: thumbnail(),
      slug,
    });

    expect(outcome.result).toEqual({
      error: saveFailure(),
      ok: false,
    });
    expect(outcome.cleanupIssues).toEqual([]);
    expect(fake.remove).not.toHaveBeenCalled();
  });
});
