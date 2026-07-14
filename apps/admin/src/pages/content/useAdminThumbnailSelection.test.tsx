// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAdminThumbnailSelection } from "./useAdminThumbnailSelection";

function fileList(file: File): FileList {
  return {
    0: file,
    item: (index: number) => (index === 0 ? file : null),
    length: 1,
  } as unknown as FileList;
}

describe("useAdminThumbnailSelection", () => {
  const createObjectURL = vi.fn<(file: Blob) => string>();
  const revokeObjectURL = vi.fn<(url: string) => void>();

  beforeEach(() => {
    createObjectURL.mockReset();
    revokeObjectURL.mockReset();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectURL,
    });
  });

  it("preserves the prior valid selection when a later file is invalid", () => {
    createObjectURL.mockReturnValue("blob:valid");
    const hook = renderHook(() => useAdminThumbnailSelection());
    const valid = new File(["image"], "valid.webp", { type: "image/webp" });
    const invalid = new File(["text"], "invalid.txt", {
      type: "text/plain",
    });

    act(() => {
      expect(hook.result.current.select(fileList(valid))).toEqual({ ok: true });
    });
    act(() => {
      expect(hook.result.current.select(fileList(invalid))).toEqual({
        message: "썸네일은 PNG, JPEG, WEBP 파일만 업로드할 수 있습니다.",
        ok: false,
      });
    });

    expect(hook.result.current.selection.previewUrl).toBe("blob:valid");
    expect(hook.result.current.selection.selected?.file).toBe(valid);
    expect(revokeObjectURL).not.toHaveBeenCalled();
  });

  it("revokes only owned blob URLs exactly once on replace, reset, and unmount", () => {
    createObjectURL
      .mockReturnValueOnce("blob:first")
      .mockReturnValueOnce("blob:second")
      .mockReturnValueOnce("blob:third");
    const hook = renderHook(() =>
      useAdminThumbnailSelection("https://cdn.example.com/original.webp"),
    );
    const first = new File(["a"], "first.png", { type: "image/png" });
    const second = new File(["b"], "second.jpg", { type: "image/jpeg" });
    const third = new File(["c"], "third.webp", { type: "image/webp" });

    act(() => {
      hook.result.current.select(fileList(first));
      hook.result.current.select(fileList(second));
    });
    expect(revokeObjectURL).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenNthCalledWith(1, "blob:first");

    act(() => hook.result.current.reset("https://cdn.example.com/saved.webp"));
    expect(revokeObjectURL).toHaveBeenCalledTimes(2);
    expect(revokeObjectURL).toHaveBeenNthCalledWith(2, "blob:second");

    act(() => hook.result.current.select(fileList(third)));
    hook.unmount();
    expect(revokeObjectURL).toHaveBeenCalledTimes(3);
    expect(revokeObjectURL).toHaveBeenNthCalledWith(3, "blob:third");
    expect(revokeObjectURL).not.toHaveBeenCalledWith(
      "https://cdn.example.com/original.webp",
    );
    expect(revokeObjectURL).not.toHaveBeenCalledWith(
      "https://cdn.example.com/saved.webp",
    );
  });

  it("revokes the owned preview once when removed repeatedly", () => {
    createObjectURL.mockReturnValue("blob:removed");
    const hook = renderHook(() => useAdminThumbnailSelection());
    const file = new File(["image"], "removed.webp", {
      type: "image/webp",
    });

    act(() => hook.result.current.select(fileList(file)));
    act(() => {
      hook.result.current.remove();
      hook.result.current.remove();
    });
    hook.unmount();

    expect(revokeObjectURL).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:removed");
    expect(hook.result.current.selection).toEqual({ removed: true });
  });
});
