import { describe, expect, it } from "vitest";
import {
  createRawAssetReviewItems,
  isSupportedHtmlSourceFile,
  proposedRawAssetRelativePath,
  rawAssetReviewStatusLabel,
  rawHtmlContainsBaseElement,
  updateRawAssetReviewItem,
} from "./rawAssetReview";

describe("raw asset review", () => {
  it("uses a selected directory path verbatim and otherwise proposes images/name", () => {
    const direct = new File(["a"], "image.png", { type: "image/png" });
    const nested = new File(["b"], "nested.png", { type: "image/png" });
    Object.defineProperty(nested, "webkitRelativePath", {
      value: "parent/images/nested.png",
    });

    expect(proposedRawAssetRelativePath(direct)).toBe("images/image.png");
    expect(proposedRawAssetRelativePath(nested)).toBe(
      "parent/images/nested.png",
    );
    expect(
      createRawAssetReviewItems(
        [direct, nested],
        (() => {
          let id = 0;
          return () => `id-${++id}`;
        })(),
      ).map((item) => [item.id, item.relativePath, item.status]),
    ).toEqual([
      ["id-1", "images/image.png", "ready"],
      ["id-2", "parent/images/nested.png", "ready"],
    ]);
  });

  it("updates one row without reordering the review list", () => {
    const items = createRawAssetReviewItems(
      [
        new File(["a"], "a.png", { type: "image/png" }),
        new File(["b"], "b.png", { type: "image/png" }),
      ],
      (() => {
        let id = 0;
        return () => String(++id);
      })(),
    );
    const updated = updateRawAssetReviewItem(items, "2", {
      relativePath: "images/renamed.png",
      status: "uploading",
    });
    expect(updated.map((item) => [item.id, item.relativePath])).toEqual([
      ["1", "images/a.png"],
      ["2", "images/renamed.png"],
    ]);
    expect(items[1]?.status).toBe("ready");
  });

  it("detects authored base elements without matching similar names", () => {
    expect(rawHtmlContainsBaseElement("<BASE href='/'>")).toBe(true);
    expect(rawHtmlContainsBaseElement("<base/>")).toBe(true);
    expect(rawHtmlContainsBaseElement("<baseline>text</baseline>")).toBe(false);
  });

  it("accepts html source by MIME or extension", () => {
    expect(
      isSupportedHtmlSourceFile(
        new File([""], "source.bin", { type: "text/html" }),
      ),
    ).toBe(true);
    expect(isSupportedHtmlSourceFile(new File([""], "source.HTM"))).toBe(true);
    expect(isSupportedHtmlSourceFile(new File([""], "source.txt"))).toBe(false);
  });

  it("uses stable Korean status labels", () => {
    expect(
      (["ready", "uploading", "uploaded", "error", "removing"] as const).map(
        rawAssetReviewStatusLabel,
      ),
    ).toEqual(["검토 대기", "업로드 중", "업로드 완료", "오류", "정리 중"]);
  });
});
