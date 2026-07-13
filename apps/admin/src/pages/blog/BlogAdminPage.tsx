import { BlogFormPage } from "./BlogFormPage";
import { BlogListPage } from "./BlogListPage";
import type { BlogAdminPageProps } from "./blogTypes";

export function BlogAdminPage({ onNavigate, route }: BlogAdminPageProps) {
  if (route.id === "blog") {
    return <BlogListPage onNavigate={onNavigate} />;
  }

  if (route.id === "blogNew" || route.id === "blogDetail") {
    return <BlogFormPage onNavigate={onNavigate} route={route} />;
  }

  return null;
}
