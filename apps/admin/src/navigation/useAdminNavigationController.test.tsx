// @vitest-environment jsdom
import { cleanup, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { StrictMode, type ReactNode, useLayoutEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminShell } from "../components/admin/AdminShell";
import { withAdminHistoryIndex } from "../lib/router";
import {
  PendingAssetNavigationProvider,
  usePendingAssetNavigation,
  usePendingAssetRegistration,
} from "./PendingAssetNavigation";
import { useAdminNavigationController } from "./useAdminNavigationController";

function indexedState(index: number): Record<string, unknown> {
  return withAdminHistoryIndex({ fixture: true }, index);
}

function dispatchPopstate(path: string, state: unknown): void {
  window.history.replaceState(state, "", path);
  window.dispatchEvent(new PopStateEvent("popstate", { state }));
}

function StrictWrapper({ children }: { readonly children: ReactNode }) {
  return <StrictMode>{children}</StrictMode>;
}

beforeEach(() => {
  window.history.replaceState(indexedState(2), "", "/blog/new");
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("useAdminNavigationController popstate integration", () => {
  it.each([
    {
      currentIndex: 2,
      currentPath: "/blog/new",
      expectedDelta: 1,
      targetIndex: 1,
      targetPath: "/blog",
    },
    {
      currentIndex: 1,
      currentPath: "/blog",
      expectedDelta: -1,
      targetIndex: 2,
      targetPath: "/blog/new",
    },
  ])(
    "restores an indexed popstate with delta $expectedDelta and ignores its completion",
    ({ currentIndex, currentPath, expectedDelta, targetIndex, targetPath }) => {
      window.history.replaceState(indexedState(currentIndex), "", currentPath);
      const announceBlockedAttempt = vi.fn();
      const onRouteAccepted = vi.fn();
      const go = vi.spyOn(window.history, "go").mockImplementation(() => undefined);

      renderHook(
        () =>
          useAdminNavigationController({
            announceBlockedAttempt,
            getPendingAssetCount: () => 1,
            onRouteAccepted,
          }),
        { wrapper: StrictWrapper },
      );

      const targetState = indexedState(targetIndex);
      window.history.replaceState(targetState, "", targetPath);
      const pushState = vi.spyOn(window.history, "pushState");
      const replaceState = vi.spyOn(window.history, "replaceState");
      window.dispatchEvent(new PopStateEvent("popstate", { state: targetState }));
      expect(go).toHaveBeenCalledTimes(1);
      expect(go).toHaveBeenLastCalledWith(expectedDelta);
      expect(announceBlockedAttempt).toHaveBeenCalledTimes(1);
      expect(onRouteAccepted).not.toHaveBeenCalled();
      expect(pushState).not.toHaveBeenCalled();
      expect(replaceState).not.toHaveBeenCalled();

      pushState.mockRestore();
      replaceState.mockRestore();
      dispatchPopstate(currentPath, indexedState(currentIndex));
      expect(go).toHaveBeenCalledTimes(1);
      expect(announceBlockedAttempt).toHaveBeenCalledTimes(1);
      expect(onRouteAccepted).not.toHaveBeenCalled();
    },
  );

  it("accepts an unindexed target so the URL and rendered route stay aligned", () => {
    const acceptedPaths: string[] = [];
    const announceBlockedAttempt = vi.fn();
    const go = vi.spyOn(window.history, "go").mockImplementation(() => undefined);
    const pushState = vi.spyOn(window.history, "pushState");
    const { result } = renderHook(() =>
      useAdminNavigationController({
        announceBlockedAttempt,
        getPendingAssetCount: () => 1,
        onRouteAccepted: () => acceptedPaths.push(window.location.pathname),
      }),
    );

    dispatchPopstate("/portfolio", { foreign: true });
    expect(window.location.pathname).toBe("/portfolio");
    expect(acceptedPaths).toEqual(["/portfolio"]);
    expect(go).not.toHaveBeenCalled();
    expect(announceBlockedAttempt).not.toHaveBeenCalled();

    result.current("/portfolio/");
    expect(pushState).not.toHaveBeenCalled();
    expect(announceBlockedAttempt).not.toHaveBeenCalled();
  });

  it("re-evaluates rapid popstates and never ignores a mismatched restoration", () => {
    const announceBlockedAttempt = vi.fn();
    const onRouteAccepted = vi.fn();
    const go = vi.spyOn(window.history, "go").mockImplementation(() => undefined);
    renderHook(() =>
      useAdminNavigationController({
        announceBlockedAttempt,
        getPendingAssetCount: () => 1,
        onRouteAccepted,
      }),
    );

    dispatchPopstate("/blog", indexedState(1));
    dispatchPopstate("/portfolio", indexedState(0));
    expect(go.mock.calls).toEqual([[1], [2]]);
    expect(announceBlockedAttempt).toHaveBeenCalledTimes(2);
    expect(onRouteAccepted).not.toHaveBeenCalled();

    dispatchPopstate("/blog/new", indexedState(2));
    expect(go).toHaveBeenCalledTimes(2);
    expect(onRouteAccepted).not.toHaveBeenCalled();
  });

  it("accepts a same-index mismatched restoration instead of leaving stale UI", () => {
    const acceptedPaths: string[] = [];
    const go = vi.spyOn(window.history, "go").mockImplementation(() => undefined);
    renderHook(() =>
      useAdminNavigationController({
        announceBlockedAttempt: vi.fn(),
        getPendingAssetCount: () => 1,
        onRouteAccepted: () => acceptedPaths.push(window.location.pathname),
      }),
    );

    dispatchPopstate("/blog", indexedState(1));
    dispatchPopstate("/portfolio", indexedState(2));

    expect(go).toHaveBeenCalledTimes(1);
    expect(acceptedPaths).toEqual(["/portfolio"]);
  });

  it("does not let a late restoration desynchronize a newer accepted route", () => {
    const pendingCountRef = { current: 1 };
    const acceptedPaths: string[] = [];
    const go = vi.spyOn(window.history, "go").mockImplementation(() => undefined);
    const { result } = renderHook(() =>
      useAdminNavigationController({
        announceBlockedAttempt: vi.fn(),
        getPendingAssetCount: () => pendingCountRef.current,
        onRouteAccepted: () => acceptedPaths.push(window.location.pathname),
      }),
    );

    dispatchPopstate("/blog", indexedState(1));
    expect(go).toHaveBeenCalledWith(1);

    pendingCountRef.current = 0;
    result.current("/portfolio");
    expect(acceptedPaths).toEqual(["/portfolio"]);

    dispatchPopstate("/blog/new", indexedState(2));
    expect(window.location.pathname).toBe("/blog/new");
    expect(acceptedPaths).toEqual(["/portfolio", "/blog/new"]);
  });
});

describe("useAdminNavigationController choke point", () => {
  it("blocks navigation in the same layout commit that registers pending work", () => {
    const pushState = vi.spyOn(window.history, "pushState");

    function ImmediateNavigationAttempt({ count }: { readonly count: number }) {
      usePendingAssetRegistration(count);
      const { announceBlockedAttempt, getPendingAssetCount } = usePendingAssetNavigation();
      const navigate = useAdminNavigationController({
        announceBlockedAttempt,
        getPendingAssetCount,
        onRouteAccepted: vi.fn(),
      });

      useLayoutEffect(() => {
        if (count > 0) navigate("/portfolio");
      }, [count, navigate]);

      return null;
    }

    const { rerender } = render(
      <PendingAssetNavigationProvider>
        <ImmediateNavigationAttempt count={0} />
      </PendingAssetNavigationProvider>,
    );
    rerender(
      <PendingAssetNavigationProvider>
        <ImmediateNavigationAttempt count={1} />
      </PendingAssetNavigationProvider>,
    );

    expect(pushState).not.toHaveBeenCalled();
    expect(window.location.pathname).toBe("/blog/new");
    expect(document.querySelector('[role="status"][aria-live="polite"]')).not.toBeNull();
  });

  it("keeps one popstate listener while reading a newly pending count", () => {
    const addEventListener = vi.spyOn(window, "addEventListener");
    const announceBlockedAttempt = vi.fn();
    const pushState = vi.spyOn(window.history, "pushState");
    const pendingCountRef = { current: 0 };
    const getPendingAssetCount = () => pendingCountRef.current;
    const onRouteAccepted = vi.fn();
    const { rerender, result } = renderHook(
      () =>
        useAdminNavigationController({
          announceBlockedAttempt,
          getPendingAssetCount,
          onRouteAccepted,
        }),
      { wrapper: StrictWrapper },
    );
    const initialPopstateRegistrations = addEventListener.mock.calls.filter(
      ([eventName]) => eventName === "popstate",
    ).length;

    pendingCountRef.current = 1;
    rerender();
    const nextPopstateRegistrations = addEventListener.mock.calls.filter(
      ([eventName]) => eventName === "popstate",
    ).length;
    result.current("/portfolio");

    expect(initialPopstateRegistrations).toBeGreaterThan(0);
    expect(nextPopstateRegistrations).toBe(initialPopstateRegistrations);
    expect(announceBlockedAttempt).toHaveBeenCalledTimes(1);
    expect(pushState).not.toHaveBeenCalled();
    expect(window.location.pathname).toBe("/blog/new");
  });

  it("blocks form, sidebar, and logo navigation through the same controller", () => {
    const announceBlockedAttempt = vi.fn();
    const pushState = vi.spyOn(window.history, "pushState");

    function NavigationSources() {
      const navigate = useAdminNavigationController({
        announceBlockedAttempt,
        getPendingAssetCount: () => 1,
        onRouteAccepted: vi.fn(),
      });

      return (
        <AdminShell
          activeItem="blog"
          onNavigate={(item) => navigate(item.href)}
        >
          <button onClick={() => navigate("/portfolio/new")} type="button">
            폼 이동
          </button>
        </AdminShell>
      );
    }

    render(<NavigationSources />);
    fireEvent.click(screen.getByRole("link", { name: "Portfolio" }));
    fireEvent.click(screen.getByRole("link", { name: "Zerosourcing Admin" }));
    fireEvent.click(screen.getByRole("button", { name: "폼 이동" }));

    expect(announceBlockedAttempt).toHaveBeenCalledTimes(3);
    expect(pushState).not.toHaveBeenCalled();
    expect(window.location.pathname).toBe("/blog/new");
  });
});
