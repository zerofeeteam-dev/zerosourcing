export type CtaAction =
  | "outsource"
  | "quick"
  | "cases"
  | "service-mvp"
  | "service-app"
  | "service-company-homepage";

const ctaHrefs = {
  cases: "/portfolio",
  outsource: "/contact",
  quick: "https://pf.kakao.com/_EgdlX",
  "service-app": "/service/app",
  "service-company-homepage": "/service/company-homepage",
  "service-mvp": "/service/mvp",
} satisfies Record<CtaAction, string>;

export function getCtaHref(action: CtaAction) {
  return ctaHrefs[action];
}

export function emitCtaEvent(action: CtaAction) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent("zerosourcing:cta-click", {
      detail: { action },
    }),
  );
}

export function emitCtaClick(action: CtaAction) {
  if (typeof window === "undefined") {
    return;
  }

  emitCtaEvent(action);
  window.location.href = ctaHrefs[action];
}
