export type CtaAction = "outsource" | "quick" | "cases";

const ctaHrefs = {
  cases: "/portfolio",
  outsource: "/contact",
  quick: "/contact",
} satisfies Record<CtaAction, string>;

export function emitCtaClick(action: CtaAction) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent("zerosourcing:cta-click", {
      detail: { action },
    }),
  );

  window.location.href = ctaHrefs[action];
}
