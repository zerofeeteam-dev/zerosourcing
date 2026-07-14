// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useManagedContentFormState } from "./useManagedContentFormState";

type TestForm = { readonly content: string };

const createEmptyForm = (): TestForm => ({ content: "" });

function row(id: string, slug: string, updatedAt: string) {
  return { id, slug, updated_at: updatedAt };
}

describe("useManagedContentFormState", () => {
  it("allocates a unique stable key for every new document", () => {
    const first = renderHook(() =>
      useManagedContentFormState({ createEmptyForm, entity: "blog" }),
    );
    const second = renderHook(() =>
      useManagedContentFormState({ createEmptyForm, entity: "blog" }),
    );

    expect(first.result.current.documentKey).toMatch(/^blog:new:/u);
    expect(second.result.current.documentKey).toMatch(/^blog:new:/u);
    expect(first.result.current.documentKey).not.toBe(
      second.result.current.documentKey,
    );
  });

  it("accepts only the newest A-B load and rejects stale editor callbacks", () => {
    const hook = renderHook(() =>
      useManagedContentFormState({ createEmptyForm, entity: "portfolio" }),
    );
    const oldDocumentKey = hook.result.current.documentKey;
    let loadA!: ReturnType<typeof hook.result.current.beginLoad>;
    let loadB!: ReturnType<typeof hook.result.current.beginLoad>;

    act(() => {
      loadA = hook.result.current.beginLoad("a");
      loadB = hook.result.current.beginLoad("b");
    });
    act(() => {
      expect(
        hook.result.current.acceptLoaded(
          loadA,
          row("row-a", "a", "2026-07-15T00:00:00Z"),
          { content: "A" },
        ),
      ).toBe(false);
      expect(
        hook.result.current.acceptLoaded(
          loadB,
          row("row-b", "b", "2026-07-15T00:01:00Z"),
          { content: "B" },
        ),
      ).toBe(true);
    });

    expect(hook.result.current.form.content).toBe("B");
    expect(hook.result.current.documentKey).toBe(
      "portfolio:row-b:2026-07-15T00:01:00Z",
    );
    act(() => {
      expect(
        hook.result.current.updateForDocument(oldDocumentKey, {
          content: "stale",
        }),
      ).toBe(false);
    });
    expect(hook.result.current.form.content).toBe("B");
  });

  it("locks the owner during save and preserves its key across updated_at", () => {
    const hook = renderHook(() =>
      useManagedContentFormState({ createEmptyForm, entity: "blog" }),
    );
    const originalKey = hook.result.current.documentKey;
    const owner = hook.result.current.captureOwner();

    act(() => {
      expect(hook.result.current.lockOwner(owner)).toBe(true);
      expect(
        hook.result.current.updateForDocument(originalKey, {
          content: "late editor callback",
        }),
      ).toBe(false);
      expect(
        hook.result.current.acceptSaved(
          owner,
          row("saved-id", "saved-slug", "2026-07-15T03:00:00Z"),
          { content: "saved" },
        ),
      ).toBe(true);
    });

    expect(hook.result.current.form.content).toBe("saved");
    expect(hook.result.current.documentKey).toBe(originalKey);
    expect(hook.result.current.matchesCurrentRoute("saved-slug")).toBe(true);

    const accidentalReload = hook.result.current.beginLoad("saved-slug");
    act(() => {
      expect(
        hook.result.current.acceptLoaded(
          accidentalReload,
          row("saved-id", "saved-slug", "2026-07-15T04:00:00Z"),
          { content: "unexpected refetch" },
        ),
      ).toBe(false);
    });
    expect(hook.result.current.documentKey).toBe(originalKey);
    expect(hook.result.current.form.content).toBe("saved");
  });

  it("rejects a stale save after another document replaces its owner", () => {
    const hook = renderHook(() =>
      useManagedContentFormState({ createEmptyForm, entity: "blog" }),
    );
    const staleOwner = hook.result.current.captureOwner();
    act(() => {
      expect(hook.result.current.lockOwner(staleOwner)).toBe(true);
      hook.result.current.replaceWithNew();
    });
    const currentKey = hook.result.current.documentKey;

    act(() => {
      expect(
        hook.result.current.acceptSaved(
          staleOwner,
          row("stale", "stale", "2026-07-15T05:00:00Z"),
          { content: "stale save" },
        ),
      ).toBe(false);
    });
    expect(hook.result.current.documentKey).toBe(currentKey);
    expect(hook.result.current.form.content).toBe("");
  });

  it("releases the save lock when another route load begins and rejects the stale lease", () => {
    const hook = renderHook(() =>
      useManagedContentFormState({ createEmptyForm, entity: "blog" }),
    );
    const documentKey = hook.result.current.documentKey;
    const staleOwner = hook.result.current.captureOwner();

    act(() => {
      expect(hook.result.current.lockOwner(staleOwner)).toBe(true);
      hook.result.current.beginLoad("another-route");
      expect(
        hook.result.current.updateForDocument(documentKey, {
          content: "editable again",
        }),
      ).toBe(true);
    });
    expect(hook.result.current.form.content).toBe("editable again");

    const currentOwner = hook.result.current.captureOwner();
    act(() => {
      expect(hook.result.current.lockOwner(currentOwner)).toBe(true);
      expect(
        hook.result.current.acceptSaved(
          staleOwner,
          row("stale-id", "stale-slug", "2026-07-15T06:00:00Z"),
          { content: "stale save" },
        ),
      ).toBe(false);
      expect(
        hook.result.current.acceptSaved(
          currentOwner,
          row("current-id", "current-slug", "2026-07-15T07:00:00Z"),
          { content: "current save" },
        ),
      ).toBe(true);
    });

    expect(hook.result.current.form.content).toBe("current save");
    expect(hook.result.current.matchesCurrentRoute("current-slug")).toBe(true);
  });
});
