import type { AdminNavKey } from "../components/admin/AdminShell";

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

function cleanPath(pathname: string): string {
  const [pathOnly = "/"] = pathname.split("?");
  if (pathOnly.length > 1 && pathOnly.endsWith("/")) {
    return pathOnly.slice(0, -1);
  }
  return pathOnly;
}

export function matchAdminRoute(pathname: string): AdminRoute {
  const path = cleanPath(pathname);
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

export function replacePath(path: string): void {
  window.history.replaceState({}, "", path);
}

export function pushPath(path: string): void {
  if (window.location.pathname === path) return;
  window.history.pushState({}, "", path);
}
