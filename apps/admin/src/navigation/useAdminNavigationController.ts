import { useLayoutEffect, useRef } from "react";
import {
  decideAdminNavigation,
  decideAdminPopstate,
  isExpectedAdminHistoryRestoration,
  normalizeAdminPath,
  pushPath,
  readAdminHistoryIndex,
  replacePath,
  restoreAdminHistoryPosition,
} from "../lib/router";

export type AdminNavigationMode = "push" | "replace";
export type AdminNavigate = (path: string, mode?: AdminNavigationMode) => void;

type PendingHistoryRestoration = {
  readonly expectedIndex: number;
  readonly expectedPath: string;
};

type AdminPopstateTarget = {
  readonly index: number | null;
  readonly path: string;
};

type AdminNavigationControllerDependencies = {
  readonly announceBlockedAttempt: () => void;
  readonly getPendingAssetCount: () => number;
  readonly initialHistoryIndex: number | null;
  readonly initialPath: string;
  readonly onRouteAccepted: () => void;
  readonly push: (path: string) => number;
  readonly readCurrentPath: () => string;
  readonly replace: (path: string) => number;
  readonly restore: (delta: number) => void;
};

export type AdminNavigationController = {
  readonly handlePopState: (target: AdminPopstateTarget) => void;
  readonly navigate: AdminNavigate;
};

type UseAdminNavigationControllerOptions = Pick<
  AdminNavigationControllerDependencies,
  "announceBlockedAttempt" | "getPendingAssetCount" | "onRouteAccepted"
>;

export function createAdminNavigationController({
  announceBlockedAttempt,
  getPendingAssetCount,
  initialHistoryIndex,
  initialPath,
  onRouteAccepted,
  push,
  readCurrentPath,
  replace,
  restore,
}: AdminNavigationControllerDependencies): AdminNavigationController {
  let currentHistoryIndex = initialHistoryIndex;
  let currentPath = normalizeAdminPath(initialPath);
  let pendingRestoration: PendingHistoryRestoration | null = null;

  const navigate: AdminNavigate = (path, mode = "push") => {
    const decision = decideAdminNavigation(currentPath, path, getPendingAssetCount());

    if (decision === "noop") return;
    if (decision === "block") {
      announceBlockedAttempt();
      return;
    }

    pendingRestoration = null;
    currentHistoryIndex = mode === "replace" ? replace(path) : push(path);
    currentPath = normalizeAdminPath(readCurrentPath());
    onRouteAccepted();
  };

  const handlePopState = ({ index: targetIndex, path: targetPath }: AdminPopstateTarget) => {
    if (
      pendingRestoration &&
      isExpectedAdminHistoryRestoration(
        pendingRestoration.expectedIndex,
        pendingRestoration.expectedPath,
        targetIndex,
        targetPath,
      )
    ) {
      pendingRestoration = null;
      currentHistoryIndex = targetIndex;
      currentPath = normalizeAdminPath(targetPath);
      return;
    }

    // A rapid or mismatched popstate supersedes the restoration we were
    // waiting for. Re-evaluate it against the last accepted route.
    pendingRestoration = null;
    const decision = decideAdminPopstate({
      currentIndex: currentHistoryIndex,
      currentPath,
      pendingAssetCount: getPendingAssetCount(),
      targetIndex,
      targetPath,
    });

    if (decision.kind === "restore") {
      pendingRestoration = {
        expectedIndex: decision.expectedIndex,
        expectedPath: decision.expectedPath,
      };
      announceBlockedAttempt();
      restore(decision.delta);
      return;
    }

    currentHistoryIndex = decision.targetIndex;
    currentPath = normalizeAdminPath(targetPath);
    onRouteAccepted();
  };

  return { handlePopState, navigate };
}

export function useAdminNavigationController({
  announceBlockedAttempt,
  getPendingAssetCount,
  onRouteAccepted,
}: UseAdminNavigationControllerOptions): AdminNavigate {
  const callbacksRef = useRef({
    announceBlockedAttempt,
    getPendingAssetCount,
    onRouteAccepted,
  });

  useLayoutEffect(() => {
    callbacksRef.current = {
      announceBlockedAttempt,
      getPendingAssetCount,
      onRouteAccepted,
    };
  }, [announceBlockedAttempt, getPendingAssetCount, onRouteAccepted]);

  const controllerRef = useRef<AdminNavigationController | null>(null);
  if (controllerRef.current === null) {
    controllerRef.current = createAdminNavigationController({
      announceBlockedAttempt: () => callbacksRef.current.announceBlockedAttempt(),
      getPendingAssetCount: () => callbacksRef.current.getPendingAssetCount(),
      initialHistoryIndex: readAdminHistoryIndex(window.history.state),
      initialPath: window.location.pathname,
      onRouteAccepted: () => callbacksRef.current.onRouteAccepted(),
      push: pushPath,
      readCurrentPath: () => window.location.pathname,
      replace: replacePath,
      restore: restoreAdminHistoryPosition,
    });
  }
  const controller = controllerRef.current;

  useLayoutEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      controller.handlePopState({
        index: readAdminHistoryIndex(event.state),
        path: window.location.pathname,
      });
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [controller]);

  return controller.navigate;
}
