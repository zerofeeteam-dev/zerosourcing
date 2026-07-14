// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  decideAdminNavigation,
  decideAdminPopstate,
  initializeAdminHistoryIndex,
  isExpectedAdminHistoryRestoration,
  normalizeAdminPath,
  pushPath,
  readAdminHistoryIndex,
  replacePath,
  restoreAdminHistoryPosition,
  withAdminHistoryIndex,
} from "./router";

describe("admin router history", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.history.replaceState({ fixture: "preserved" }, "", "/portfolio");
  });

  it("normalizes route-equivalent paths before comparing them", () => {
    expect(normalizeAdminPath("/blog/?tab=all#top")).toBe("/blog");
    expect(decideAdminNavigation("/blog/", "/blog?tab=all", 3)).toBe("noop");
    expect(decideAdminNavigation("/blog", "/portfolio", 3)).toBe("block");
    expect(decideAdminNavigation("/blog", "/portfolio", 0)).toBe("navigate");
  });

  it("initializes one integer index without erasing existing state", () => {
    expect(initializeAdminHistoryIndex()).toBe(0);
    expect(readAdminHistoryIndex(window.history.state)).toBe(0);
    expect(window.history.state).toMatchObject({ fixture: "preserved" });

    const replaceState = vi.spyOn(window.history, "replaceState");
    expect(initializeAdminHistoryIndex()).toBe(0);
    expect(replaceState).not.toHaveBeenCalled();
  });

  it("preserves object and primitive history state while indexing it", () => {
    expect(withAdminHistoryIndex({ other: 1 }, 4)).toMatchObject({ other: 1 });
    expect(readAdminHistoryIndex(withAdminHistoryIndex({ other: 1 }, 4))).toBe(4);

    const primitiveState = withAdminHistoryIndex("foreign-state", 2);
    expect(readAdminHistoryIndex(primitiveState)).toBe(2);
    expect(Object.values(primitiveState)).toContain("foreign-state");
  });

  it("increments push entries and preserves the index on replace", () => {
    initializeAdminHistoryIndex();

    expect(pushPath("/blog")).toBe(1);
    expect(window.location.pathname).toBe("/blog");
    expect(readAdminHistoryIndex(window.history.state)).toBe(1);
    expect(window.history.state).toMatchObject({ fixture: "preserved" });

    expect(replacePath("/blog/new")).toBe(1);
    expect(window.location.pathname).toBe("/blog/new");
    expect(readAdminHistoryIndex(window.history.state)).toBe(1);
    expect(window.history.state).toMatchObject({ fixture: "preserved" });
  });

  it("does not create a history entry for the same normalized path", () => {
    initializeAdminHistoryIndex();
    const pushState = vi.spyOn(window.history, "pushState");

    expect(pushPath("/portfolio/?view=list")).toBe(0);
    expect(pushState).not.toHaveBeenCalled();
  });

  it("restores blocked Back and Forward using the exact indexed delta", () => {
    const blockedBack = decideAdminPopstate({
      currentIndex: 2,
      currentPath: "/blog/new",
      pendingAssetCount: 1,
      targetIndex: 1,
      targetPath: "/blog",
    });
    const blockedForward = decideAdminPopstate({
      currentIndex: 1,
      currentPath: "/blog",
      pendingAssetCount: 1,
      targetIndex: 2,
      targetPath: "/blog/new",
    });

    expect(blockedBack).toMatchObject({ delta: 1, kind: "restore" });
    expect(blockedForward).toMatchObject({ delta: -1, kind: "restore" });

    const go = vi.spyOn(window.history, "go").mockImplementation(() => undefined);
    const pushState = vi.spyOn(window.history, "pushState");
    const replaceState = vi.spyOn(window.history, "replaceState");
    if (blockedBack.kind === "restore") restoreAdminHistoryPosition(blockedBack.delta);
    if (blockedForward.kind === "restore") restoreAdminHistoryPosition(blockedForward.delta);

    expect(go.mock.calls).toEqual([[1], [-1]]);
    expect(pushState).not.toHaveBeenCalled();
    expect(replaceState).not.toHaveBeenCalled();
  });

  it("accepts a foreign popstate when its restoration direction is unknowable", () => {
    expect(
      decideAdminPopstate({
        currentIndex: 1,
        currentPath: "/blog",
        pendingAssetCount: 1,
        targetIndex: null,
        targetPath: "/portfolio",
      }),
    ).toEqual({ kind: "accept", targetIndex: null });

    expect(
      decideAdminPopstate({
        currentIndex: 1,
        currentPath: "/blog",
        pendingAssetCount: 0,
        targetIndex: null,
        targetPath: "/portfolio",
      }),
    ).toEqual({ kind: "accept", targetIndex: null });
  });

  it("recognizes only the indexed route reached by a restoration event", () => {
    expect(isExpectedAdminHistoryRestoration(2, "/blog/new", 2, "/blog/new/")).toBe(true);
    expect(isExpectedAdminHistoryRestoration(2, "/blog/new", 1, "/blog/new")).toBe(false);
    expect(isExpectedAdminHistoryRestoration(2, "/blog/new", 2, "/blog")).toBe(false);
  });
});
