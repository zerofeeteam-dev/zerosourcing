import type { AdminRoute } from "./lib/router";
import { BlogAdminPage } from "./pages/BlogAdminPage";
import { PortfolioAdminPage } from "./pages/PortfolioAdminPage";

type AdminRouteViewProps = {
  readonly onNavigate: (path: string) => void;
  readonly route: AdminRoute;
};

export function AdminRouteView({ onNavigate, route }: AdminRouteViewProps) {
  if (route.id === "blog" || route.id === "blogDetail" || route.id === "blogNew") {
    return <BlogAdminPage onNavigate={onNavigate} route={route} />;
  }

  return <PortfolioAdminPage onNavigate={onNavigate} route={route} />;
}
