// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useManagedContentEditorState } from "./useManagedContentEditorState";

describe("useManagedContentEditorState", () => {
  it("resets for a new document and ignores stale busy/pending callbacks", () => {
    let activeDocumentKey = "blog:new:a";
    const documentIsCurrent = (documentKey: string) =>
      documentKey === activeDocumentKey;
    const hook = renderHook(
      ({ documentKey }) =>
        useManagedContentEditorState(documentKey, documentIsCurrent),
      { initialProps: { documentKey: activeDocumentKey } },
    );

    act(() => {
      hook.result.current.onBusyChange(false);
      hook.result.current.onPendingAssetCountChange(2);
    });
    expect(hook.result.current.busy).toBe(false);
    expect(hook.result.current.pendingAssetCount).toBe(2);

    const oldBusy = hook.result.current.onBusyChange;
    const oldPending = hook.result.current.onPendingAssetCountChange;
    activeDocumentKey = "blog:row-b:updated";
    hook.rerender({ documentKey: activeDocumentKey });
    expect(hook.result.current.busy).toBe(true);
    expect(hook.result.current.pendingAssetCount).toBe(0);

    act(() => {
      oldBusy(false);
      oldPending(9);
    });
    expect(hook.result.current.busy).toBe(true);
    expect(hook.result.current.pendingAssetCount).toBe(0);
  });
});
