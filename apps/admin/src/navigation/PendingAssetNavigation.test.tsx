// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { StrictMode, useLayoutEffect } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminShell } from "../components/admin/AdminShell";
import {
  PendingAssetNavigationProvider,
  usePendingAssetNavigation,
  usePendingAssetRegistration,
} from "./PendingAssetNavigation";

type RegistrationProps = {
  readonly count: number;
};

function Registration({ count }: RegistrationProps) {
  usePendingAssetRegistration(count);
  return null;
}

function NavigationProbe() {
  const {
    announceBlockedAttempt,
    blockedNavigationMessage,
    pendingAssetCount,
  } = usePendingAssetNavigation();

  return (
    <div>
      <output data-testid="pending-count">{pendingAssetCount}</output>
      <output data-testid="message-value">{blockedNavigationMessage ?? "none"}</output>
      <button onClick={announceBlockedAttempt} type="button">
        이동 시도 알림
      </button>
    </div>
  );
}

type RegistrationFixtureProps = {
  readonly firstCount: number;
  readonly secondCount: number;
  readonly onLayoutCommit?: (wasBeforeUnloadPrevented: boolean) => void;
  readonly showFirst?: boolean;
  readonly showSecond?: boolean;
};

function RegistrationFixture({
  firstCount,
  onLayoutCommit,
  secondCount,
  showFirst = true,
  showSecond = true,
}: RegistrationFixtureProps) {
  return (
    <StrictMode>
      <PendingAssetNavigationProvider>
        {showFirst ? <Registration count={firstCount} /> : null}
        {showSecond ? <Registration count={secondCount} /> : null}
        {onLayoutCommit ? <LayoutBeforeUnloadProbe onCommit={onLayoutCommit} /> : null}
        <NavigationProbe />
      </PendingAssetNavigationProvider>
    </StrictMode>
  );
}

function LayoutBeforeUnloadProbe({
  onCommit,
}: {
  readonly onCommit: (wasBeforeUnloadPrevented: boolean) => void;
}) {
  useLayoutEffect(() => {
    const event = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(event);
    onCommit(event.defaultPrevented);
  }, [onCommit]);

  return null;
}

function dispatchClickWithoutNativeNavigation(
  element: Element,
  init: MouseEventInit = {},
): boolean {
  let wasPreventedByReact = false;
  const cancelNativeNavigation = (event: MouseEvent) => {
    wasPreventedByReact = event.defaultPrevented;
    event.preventDefault();
  };

  document.addEventListener("click", cancelNativeNavigation, { once: true });
  element.dispatchEvent(
    new MouseEvent("click", {
      bubbles: true,
      button: 0,
      cancelable: true,
      ...init,
    }),
  );
  return wasPreventedByReact;
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("PendingAssetNavigationProvider", () => {
  it("aggregates token registrations without StrictMode duplication or stale counts", () => {
    const { rerender } = render(<RegistrationFixture firstCount={2} secondCount={3} />);
    expect(screen.getByTestId("pending-count").textContent).toBe("5");

    rerender(<RegistrationFixture firstCount={4} secondCount={3} />);
    expect(screen.getByTestId("pending-count").textContent).toBe("7");

    rerender(
      <RegistrationFixture
        firstCount={4}
        secondCount={3}
        showFirst={false}
      />,
    );
    expect(screen.getByTestId("pending-count").textContent).toBe("3");

    rerender(<RegistrationFixture firstCount={0} secondCount={-2} />);
    expect(screen.getByTestId("pending-count").textContent).toBe("0");
  });

  it("guards beforeunload only while registered work remains", () => {
    const addEventListener = vi.spyOn(window, "addEventListener");
    const { rerender, unmount } = render(
      <RegistrationFixture firstCount={1} secondCount={0} showSecond={false} />,
    );
    const listenerCountAfterMount = addEventListener.mock.calls.filter(
      ([eventName]) => eventName === "beforeunload",
    ).length;

    const guardedEvent = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(guardedEvent);
    expect(guardedEvent.defaultPrevented).toBe(true);

    rerender(<RegistrationFixture firstCount={0} secondCount={0} showSecond={false} />);
    const unguardedEvent = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(unguardedEvent);
    expect(unguardedEvent.defaultPrevented).toBe(false);

    rerender(<RegistrationFixture firstCount={1} secondCount={0} showSecond={false} />);
    const listenerCountAfterUpdates = addEventListener.mock.calls.filter(
      ([eventName]) => eventName === "beforeunload",
    ).length;
    expect(listenerCountAfterUpdates).toBe(listenerCountAfterMount);
    unmount();
    const eventAfterUnmount = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(eventAfterUnmount);
    expect(eventAfterUnmount.defaultPrevented).toBe(false);
  });

  it("guards a 0-to-pending transition during the same layout commit", () => {
    const layoutResults: boolean[] = [];
    const onLayoutCommit = (wasPrevented: boolean) => layoutResults.push(wasPrevented);
    const { rerender } = render(
      <RegistrationFixture firstCount={0} secondCount={0} showSecond={false} />,
    );

    rerender(
      <RegistrationFixture
        firstCount={1}
        onLayoutCommit={onLayoutCommit}
        secondCount={0}
        showSecond={false}
      />,
    );

    expect(layoutResults.length).toBeGreaterThan(0);
    expect(layoutResults.every(Boolean)).toBe(true);
  });

  it("shows one polite Korean notice without claiming an exact file count", () => {
    const { rerender } = render(
      <RegistrationFixture firstCount={2} secondCount={0} showSecond={false} />,
    );

    expect(document.querySelector('[role="status"][aria-live="polite"]')).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "이동 시도 알림" }));

    const notice = document.querySelector<HTMLElement>('[role="status"][aria-live="polite"]');
    expect(notice).not.toBeNull();
    if (!notice) throw new Error("이동 차단 안내가 표시되지 않았습니다.");
    expect(notice.getAttribute("role")).toBe("status");
    expect(notice.getAttribute("aria-live")).toBe("polite");
    expect(notice.textContent).toContain("이미지 업로드가 진행 중입니다");
    expect(notice.textContent).not.toMatch(/\d/u);
    expect(screen.getByTestId("message-value").textContent).not.toBe("none");

    rerender(<RegistrationFixture firstCount={0} secondCount={0} showSecond={false} />);
    expect(document.querySelector('[role="status"][aria-live="polite"]')).toBeNull();
    expect(screen.getByTestId("message-value").textContent).toBe("none");
  });
});

describe("AdminShell navigation links", () => {
  it("routes an unmodified logo click through the shared callback", () => {
    const onNavigate = vi.fn();
    render(
      <AdminShell activeItem="portfolio" onNavigate={onNavigate}>
        content
      </AdminShell>,
    );

    const logo = screen.getByRole("link", { name: "Zerosourcing Admin" });
    expect(dispatchClickWithoutNativeNavigation(logo)).toBe(true);
    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(onNavigate).toHaveBeenCalledWith(
      expect.objectContaining({ href: "/portfolio", key: "portfolio" }),
    );
  });

  it("leaves modified and middle logo clicks to the browser", () => {
    const onNavigate = vi.fn();
    render(
      <AdminShell activeItem="portfolio" onNavigate={onNavigate}>
        content
      </AdminShell>,
    );

    const logo = screen.getByRole("link", { name: "Zerosourcing Admin" });
    expect(dispatchClickWithoutNativeNavigation(logo, { ctrlKey: true })).toBe(false);
    expect(dispatchClickWithoutNativeNavigation(logo, { button: 1 })).toBe(false);
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it("preserves the native link when no callback is provided", () => {
    render(<AdminShell activeItem="portfolio">content</AdminShell>);

    const logo = screen.getByRole("link", { name: "Zerosourcing Admin" });
    expect(logo.getAttribute("href")).toBe("/portfolio");
    expect(dispatchClickWithoutNativeNavigation(logo)).toBe(false);
  });
});
