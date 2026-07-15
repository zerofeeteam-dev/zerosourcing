export const ADMIN_PAGE_TITLE = "제로소싱 | 어드민" as const;

export function applyAdminPageTitle(): void {
  document.title = ADMIN_PAGE_TITLE;
}
