// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { moveToFirstAdminFormFailure } from "./useAdminFormFailureNavigation";

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

it("prefers the first invalid field and respects reduced motion", () => {
  const root = document.createElement("section");
  const first = document.createElement("input");
  const second = document.createElement("input");
  const globalError = document.createElement("p");
  first.setAttribute("aria-invalid", "true");
  second.setAttribute("aria-invalid", "true");
  globalError.dataset.adminGlobalErrorTarget = "";
  globalError.tabIndex = -1;
  root.append(globalError, first, second);
  document.body.append(root);

  const scrollIntoView = vi.fn();
  Object.defineProperty(first, "scrollIntoView", {
    configurable: true,
    value: scrollIntoView,
  });
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn(() => ({ matches: true })),
  });

  moveToFirstAdminFormFailure(root);

  expect(document.activeElement).toBe(first);
  expect(scrollIntoView).toHaveBeenCalledWith({
    behavior: "auto",
    block: "center",
  });
});

it("falls back to the global error when no field error exists", () => {
  const root = document.createElement("section");
  const globalError = document.createElement("p");
  globalError.dataset.adminGlobalErrorTarget = "";
  globalError.tabIndex = -1;
  root.append(globalError);
  document.body.append(root);

  const scrollIntoView = vi.fn();
  Object.defineProperty(globalError, "scrollIntoView", {
    configurable: true,
    value: scrollIntoView,
  });
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn(() => ({ matches: false })),
  });

  moveToFirstAdminFormFailure(root);

  expect(document.activeElement).toBe(globalError);
  expect(scrollIntoView).toHaveBeenCalledWith({
    behavior: "smooth",
    block: "center",
  });
});
