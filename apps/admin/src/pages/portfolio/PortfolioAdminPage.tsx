import { PortfolioFormPage } from "./PortfolioFormPage";
import { PortfolioListPage } from "./PortfolioListPage";
import type { PortfolioAdminPageProps } from "./portfolioTypes";

export function PortfolioAdminPage({ onNavigate, route }: PortfolioAdminPageProps) {
  if (route.id === "portfolio") {
    return <PortfolioListPage onNavigate={onNavigate} />;
  }

  if (route.id === "portfolioNew" || route.id === "portfolioDetail") {
    return <PortfolioFormPage onNavigate={onNavigate} route={route} />;
  }

  return null;
}
