// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  adminThumbnailImageDimensions,
  normalizeAdminThumbnailFile,
} from "./adminValidation";
import type { AdminThumbnailFile } from "./adminTypes";

function thumbnail(file: File): AdminThumbnailFile {
  return {
    file,
    mimeType: "image/webp",
    sizeBytes: file.size,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("normalizeAdminThumbnailFile", () => {
  it("center-crops and resizes a mismatched image to 1080 by 720", async () => {
    const bitmap = {
      close: vi.fn(),
      height: 900,
      width: 1600,
    } as unknown as ImageBitmap;
    const drawImage = vi.fn();
    const createElement = document.createElement.bind(document);
    vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue(bitmap));
    vi.spyOn(document, "createElement").mockImplementation(((
      tagName: string,
    ) => {
      if (tagName !== "canvas") return createElement(tagName);
      return {
        getContext: () => ({ drawImage }),
        toBlob: (callback: BlobCallback, mimeType?: string) =>
          callback(new Blob(["normalized"], { type: mimeType })),
      } as unknown as HTMLCanvasElement;
    }) as typeof document.createElement);
    const original = new File(["source"], "source.webp", {
      type: "image/webp",
    });

    const result = await normalizeAdminThumbnailFile(
      thumbnail(original),
      "thumbnail",
    );

    expect(result).toMatchObject({ ok: true });
    if (!result.ok) return;
    expect(result.value.file).not.toBe(original);
    expect(result.value.file.type).toBe("image/webp");
    expect(result.value.mimeType).toBe("image/webp");
    expect(result.value.sizeBytes).toBe(result.value.file.size);
    expect(drawImage).toHaveBeenCalledWith(
      bitmap,
      125,
      0,
      1350,
      900,
      0,
      0,
      adminThumbnailImageDimensions.width,
      adminThumbnailImageDimensions.height,
    );
    expect(bitmap.close).toHaveBeenCalledOnce();
  });

  it("keeps the selected file when image bitmap support is unavailable", async () => {
    vi.stubGlobal("createImageBitmap", undefined);
    const original = new File(["source"], "source.webp", {
      type: "image/webp",
    });

    await expect(
      normalizeAdminThumbnailFile(thumbnail(original), "thumbnail"),
    ).resolves.toEqual({ ok: true, value: thumbnail(original) });
  });
});
