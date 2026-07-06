export type CtaAction = "outsource" | "quick" | "cases";

export function emitCtaClick(action: CtaAction) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent("zerosourcing:cta-click", {
      detail: { action },
    }),
  );
}
