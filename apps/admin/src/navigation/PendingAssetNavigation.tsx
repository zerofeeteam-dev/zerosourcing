import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import styles from "./PendingAssetNavigation.module.css";

const blockedNavigationMessage =
  "이미지 업로드가 진행 중입니다. 업로드가 끝난 뒤 다시 이동해 주세요.";

type RegistrationToken = object;

type PendingAssetNavigationContextValue = {
  readonly announceBlockedAttempt: () => void;
  readonly blockedNavigationMessage: string | null;
  readonly getPendingAssetCount: () => number;
  readonly pendingAssetCount: number;
  readonly removeRegistration: (token: RegistrationToken) => void;
  readonly updateRegistration: (token: RegistrationToken, count: number) => void;
};

export type PendingAssetNavigationState = Pick<
  PendingAssetNavigationContextValue,
  | "announceBlockedAttempt"
  | "blockedNavigationMessage"
  | "getPendingAssetCount"
  | "pendingAssetCount"
>;

type PendingAssetNavigationProviderProps = {
  readonly children: ReactNode;
};

const PendingAssetNavigationContext = createContext<PendingAssetNavigationContextValue | null>(null);

function normalizeRegistrationCount(count: number): number {
  if (!Number.isFinite(count) || count <= 0) return 0;
  return Math.min(Math.floor(count), Number.MAX_SAFE_INTEGER);
}

function usePendingAssetNavigationContext(): PendingAssetNavigationContextValue {
  const context = useContext(PendingAssetNavigationContext);
  if (!context) {
    throw new Error("PendingAssetNavigationProvider 안에서 사용해야 합니다.");
  }
  return context;
}

export function PendingAssetNavigationProvider({
  children,
}: PendingAssetNavigationProviderProps) {
  const registrationsRef = useRef(new Map<RegistrationToken, number>());
  const pendingAssetCountRef = useRef(0);
  const [pendingAssetCount, setPendingAssetCount] = useState(0);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  const updateAggregateCount = useCallback(() => {
    let nextCount = 0;
    for (const count of registrationsRef.current.values()) {
      nextCount = Math.min(nextCount + count, Number.MAX_SAFE_INTEGER);
    }

    pendingAssetCountRef.current = nextCount;
    setPendingAssetCount((currentCount) => (currentCount === nextCount ? currentCount : nextCount));
    if (nextCount === 0) setNoticeMessage(null);
  }, []);

  const updateRegistration = useCallback(
    (token: RegistrationToken, count: number) => {
      const normalizedCount = normalizeRegistrationCount(count);
      if (normalizedCount === 0) {
        registrationsRef.current.delete(token);
      } else {
        registrationsRef.current.set(token, normalizedCount);
      }
      updateAggregateCount();
    },
    [updateAggregateCount],
  );

  const removeRegistration = useCallback(
    (token: RegistrationToken) => {
      if (!registrationsRef.current.delete(token)) return;
      updateAggregateCount();
    },
    [updateAggregateCount],
  );

  const announceBlockedAttempt = useCallback(() => {
    setNoticeMessage(blockedNavigationMessage);
  }, []);

  const getPendingAssetCount = useCallback(() => pendingAssetCountRef.current, []);

  useLayoutEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (pendingAssetCountRef.current === 0) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const contextValue = useMemo<PendingAssetNavigationContextValue>(
    () => ({
      announceBlockedAttempt,
      blockedNavigationMessage: noticeMessage,
      getPendingAssetCount,
      pendingAssetCount,
      removeRegistration,
      updateRegistration,
    }),
    [
      announceBlockedAttempt,
      getPendingAssetCount,
      noticeMessage,
      pendingAssetCount,
      removeRegistration,
      updateRegistration,
    ],
  );

  return (
    <PendingAssetNavigationContext.Provider value={contextValue}>
      {children}
      {noticeMessage ? (
        <p
          aria-atomic="true"
          aria-live="polite"
          className={styles.notice}
          role="status"
        >
          {noticeMessage}
        </p>
      ) : null}
    </PendingAssetNavigationContext.Provider>
  );
}

export function usePendingAssetRegistration(count: number): void {
  const { removeRegistration, updateRegistration } = usePendingAssetNavigationContext();
  const tokenRef = useRef<RegistrationToken | null>(null);
  if (tokenRef.current === null) tokenRef.current = {};

  useLayoutEffect(() => {
    const token = tokenRef.current;
    if (!token) return;

    updateRegistration(token, count);
  }, [count, updateRegistration]);

  useLayoutEffect(() => {
    const token = tokenRef.current;
    return () => {
      if (token) removeRegistration(token);
    };
  }, [removeRegistration]);
}

export function usePendingAssetNavigation(): PendingAssetNavigationState {
  const {
    announceBlockedAttempt,
    blockedNavigationMessage: message,
    getPendingAssetCount,
    pendingAssetCount,
  } = usePendingAssetNavigationContext();

  return {
    announceBlockedAttempt,
    blockedNavigationMessage: message,
    getPendingAssetCount,
    pendingAssetCount,
  };
}
