import { describe, expect, it } from "vitest";
import { thumbnailCleanupFailure } from "../../lib/adminErrors";
import {
  managedContentActionBlockReason,
  thumbnailCleanupWarning,
} from "./managedContentFormFeedback";

describe("managed content form feedback", () => {
  it("prioritizes a concrete pending-asset reason", () => {
    expect(
      managedContentActionBlockReason({
        editorBusy: true,
        pendingAssetCount: 2,
      }),
    ).toContain("2개");
    expect(
      managedContentActionBlockReason({
        editorBusy: true,
        pendingAssetCount: 0,
      }),
    ).toContain("준비");
    expect(
      managedContentActionBlockReason({
        editorBusy: false,
        pendingAssetCount: 0,
      }),
    ).toBeUndefined();
  });

  it("keeps cleanup warnings and their manual path visible", () => {
    expect(
      thumbnailCleanupWarning([
        {
          failure: thumbnailCleanupFailure("old/path.webp"),
          path: "old/path.webp",
          stage: "remove_replaced_upload",
        },
      ]),
    ).toContain("old/path.webp");
  });
});
