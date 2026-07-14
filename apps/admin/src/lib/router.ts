import type { AdminNavKey } from "../components/admin/AdminShell";

const adminHistoryIndexKey = "__zerosourcingAdminHistoryIndex";
const preservedHistoryStateKey = "__zerosourcingPreservedHistoryState";

type HistoryStateRecord = Record<string, unknown>;

export type AdminNavigationDecision = "block" | "navigate" | "noop";

export type AdminPopstateDecision =
  | { readonly kind: "accept"; readonly targetIndex: number | null }
  | {
      readonly delta: number;
      readonly expectedIndex: number;
      readonly expectedPath: string;
      readonly kind: "restore";
    };

type AdminPopstateDecisionInput = {
  readonly currentIndex: number | null;
  readonly currentPath: string;
  readonly pendingAssetCount: number;
  readonly targetIndex: number | null;
  readonly targetPath: string;
};

export type AdminRoute =
  | { readonly id: "blog"; readonly path: "/blog"; readonly protected: true }
  | { readonly id: "blogDetail"; readonly param: string; readonly path: string; readonly protected: true }
  | { readonly id: "blogNew"; readonly path: "/blog/new"; readonly protected: true }
  | { readonly id: "login"; readonly path: "/login"; readonly protected: false }
  | { readonly id: "portfolio"; readonly path: "/portfolio"; readonly protected: true }
  | {
      readonly id: "portfolioDetail";
      readonly param: string;
      readonly path: string;
      readonly protected: true;
    }
  | { readonly id: "portfolioNew"; readonly path: "/portfolio/new"; readonly protected: true };

export const defaultAdminPath = "/portfolio";
export const loginPath = "/login";

function isHistoryStateRecord(value: unknown): value is HistoryStateRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizePendingAssetCount(count: number): number {
  if (!Number.isFinite(count) || count <= 0) return 0;
  return Math.floor(count);
}

export function normalizeAdminPath(pathname: string): string {
  const [pathOnly = "/"] = pathname.split(/[?#]/u);
  const rootedPath = pathOnly.startsWith("/") ? pathOnly : `/${pathOnly}`;

  if (rootedPath.length > 1 && rootedPath.endsWith("/")) {
    return rootedPath.replace(/\/+$/u, "") || "/";
  }

  return rootedPath || "/";
}

export function readAdminHistoryIndex(state: unknown): number | null {
  if (!isHistoryStateRecord(state)) return null;

  const index = state[adminHistoryIndexKey];
  return Number.isSafeInteger(index) && Number(index) >= 0 ? Number(index) : null;
}

export function withAdminHistoryIndex(state: unknown, index: number): HistoryStateRecord {
  const safeIndex = Number.isSafeInteger(index) && index >= 0 ? index : 0;

  if (isHistoryStateRecord(state)) {
    return { ...state, [adminHistoryIndexKey]: safeIndex };
  }

  if (state === null || state === undefined) {
    return { [adminHistoryIndexKey]: safeIndex };
  }

  return {
    [preservedHistoryStateKey]: state,
    [adminHistoryIndexKey]: safeIndex,
  };
}

export function initializeAdminHistoryIndex(): number {
  const existingIndex = readAdminHistoryIndex(window.history.state);
  if (existingIndex !== null) return existingIndex;

  const initialIndex = 0;
  window.history.replaceState(
    withAdminHistoryIndex(window.history.state, initialIndex),
    "",
    window.location.href,
  );
  return initialIndex;
}

export function decideAdminNavigation(
  currentPath: string,
  targetPath: string,
  pendingAssetCount: number,
): AdminNavigationDecision {
  if (normalizeAdminPath(currentPath) === normalizeAdminPath(targetPath)) {
    return "noop";
  }

  return normalizePendingAssetCount(pendingAssetCount) > 0 ? "block" : "navigate";
}

export function decideAdminPopstate({
  currentIndex,
  currentPath,
  pendingAssetCount,
  targetIndex,
  targetPath,
}: AdminPopstateDecisionInput): AdminPopstateDecision {
  if (
    normalizeAdminPath(currentPath) === normalizeAdminPath(targetPath) ||
    normalizePendingAssetCount(pendingAssetCount) === 0
  ) {
    return { kind: "accept", targetIndex };
  }

  if (currentIndex !== null && targetIndex !== null) {
    const delta = currentIndex - targetIndex;
    if (delta !== 0) {
      return {
        delta,
        expectedIndex: currentIndex,
        expectedPath: normalizeAdminPath(currentPath),
        kind: "restore",
      };
    }
  }

  // popstate has already moved the browser's history pointer. If either entry
  // is foreign or unindexed, guessing a restoration direction can strand the
  // rendered route at a different URL. Accepting keeps all three in sync;
  // cross-document exits remain protected by beforeunload.
  return { kind: "accept", targetIndex };
}

export function isExpectedAdminHistoryRestoration(
  expectedIndex: number,
  expectedPath: string,
  targetIndex: number | null,
  targetPath: string,
): boolean {
  return (
    targetIndex === expectedIndex && normalizeAdminPath(targetPath) === normalizeAdminPath(expectedPath)
  );
}

export function restoreAdminHistoryPosition(
  delta: number,
  history: Pick<History, "go"> = window.history,
): void {
  if (!Number.isSafeInteger(delta) || delta === 0) return;
  history.go(delta);
}

export function matchAdminRoute(pathname: string): AdminRoute {
  const path = normalizeAdminPath(pathname);
  const segments = path.split("/").filter(Boolean);
  const [section, second] = segments;

  if (path === "/" || path === defaultAdminPath) {
    return { id: "portfolio", path: defaultAdminPath, protected: true };
  }

  if (path === loginPath) {
    return { id: "login", path: loginPath, protected: false };
  }

  if (section === "portfolio") {
    if (second === "new") return { id: "portfolioNew", path: "/portfolio/new", protected: true };
    if (second) return { id: "portfolioDetail", param: second, path, protected: true };
    return { id: "portfolio", path: "/portfolio", protected: true };
  }

  if (section === "blog") {
    if (second === "new") return { id: "blogNew", path: "/blog/new", protected: true };
    if (second) return { id: "blogDetail", param: second, path, protected: true };
    return { id: "blog", path: "/blog", protected: true };
  }

  return { id: "portfolio", path: defaultAdminPath, protected: true };
}

export function activeNavKeyForRoute(route: AdminRoute): AdminNavKey {
  if (route.id === "blog" || route.id === "blogDetail" || route.id === "blogNew") {
    return "blog";
  }

  return "portfolio";
}

export function replacePath(path: string): number {
  const currentIndex = readAdminHistoryIndex(window.history.state) ?? initializeAdminHistoryIndex();
  window.history.replaceState(withAdminHistoryIndex(window.history.state, currentIndex), "", path);
  return currentIndex;
}

export function pushPath(path: string): number {
  const currentIndex = readAdminHistoryIndex(window.history.state) ?? initializeAdminHistoryIndex();
  if (normalizeAdminPath(window.location.pathname) === normalizeAdminPath(path)) {
    return currentIndex;
  }

  const nextIndex = currentIndex + 1;
  window.history.pushState(withAdminHistoryIndex(window.history.state, nextIndex), "", path);
  return nextIndex;
}
