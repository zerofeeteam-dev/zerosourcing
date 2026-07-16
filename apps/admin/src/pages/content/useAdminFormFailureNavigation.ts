import { useCallback, useEffect, useRef, useState } from "react";

const fieldErrorSelector = '[aria-invalid="true"]';
const globalErrorSelector = "[data-admin-global-error-target]";

function prefersReducedMotion(): boolean {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function moveToFirstAdminFormFailure(root: HTMLElement): void {
  const field = root.querySelector<HTMLElement>(fieldErrorSelector);
  const target =
    field ?? root.querySelector<HTMLElement>(globalErrorSelector);
  if (!target) return;

  const scrollTarget =
    field instanceof HTMLInputElement && field.type === "file"
      ? field.parentElement ?? field
      : target;
  scrollTarget.scrollIntoView?.({
    behavior: prefersReducedMotion() ? "auto" : "smooth",
    block: "center",
  });
  target.focus({ preventScroll: true });
}

export function useAdminFormFailureNavigation() {
  const formRef = useRef<HTMLElement | null>(null);
  const [requestId, setRequestId] = useState(0);

  const requestFailureNavigation = useCallback(() => {
    setRequestId((current) => current + 1);
  }, []);

  useEffect(() => {
    if (requestId === 0 || !formRef.current) return;
    moveToFirstAdminFormFailure(formRef.current);
  }, [requestId]);

  return { formRef, requestFailureNavigation } as const;
}
