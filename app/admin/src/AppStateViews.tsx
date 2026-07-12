import { AdminButton } from "./components/admin/AdminButton";
import { AdminShell, type AdminNavItem } from "./components/admin/AdminShell";
import type { SupabaseDisabledConfig } from "./lib/supabase";

export function LoadingView() {
  return (
    <main className="app-state" aria-busy="true">
      <div className="app-state-panel">
        <p className="app-state-eyebrow pretendard-bold-12">ADMIN</p>
        <h1 className="app-state-title pretendard-bold-24">세션 확인 중</h1>
        <p className="app-state-copy pretendard-medium-14">
          Supabase Auth 세션과 관리자 권한을 확인하고 있습니다.
        </p>
      </div>
    </main>
  );
}

export function SetupBlockedView({ setup }: { readonly setup: SupabaseDisabledConfig }) {
  return (
    <main className="app-state">
      <div className="app-state-panel">
        <p className="app-state-eyebrow pretendard-bold-12">SETUP REQUIRED</p>
        <h1 className="app-state-title pretendard-bold-24">Supabase 설정 대기</h1>
        <p className="app-state-copy pretendard-medium-14">{setup.message}</p>
        <p className="app-state-copy pretendard-medium-14">
          실제 프로젝트 URL과 anon key가 준비되면 같은 코드로 로그인과 admin_users 권한 검사를 진행합니다.
        </p>
      </div>
    </main>
  );
}

export function ErrorView({ message }: { readonly message: string }) {
  return (
    <main className="app-state">
      <div className="app-state-panel">
        <p className="app-state-eyebrow pretendard-bold-12">AUTH ERROR</p>
        <h1 className="app-state-title pretendard-bold-24">인증 상태를 확인할 수 없습니다</h1>
        <p className="app-state-copy pretendard-medium-14">{message}</p>
      </div>
    </main>
  );
}

type AccessDeniedViewProps = {
  readonly activeItem: AdminNavItem["key"];
  readonly message: string;
  readonly onLogout: () => void;
  readonly onNavigate: (item: AdminNavItem) => void;
};

export function AccessDeniedView({ activeItem, message, onLogout, onNavigate }: AccessDeniedViewProps) {
  return (
    <AdminShell
      accountActions={
        <AdminButton onClick={onLogout} variant="secondary">
          로그아웃
        </AdminButton>
      }
      activeItem={activeItem}
      onNavigate={onNavigate}
    >
      <div className="app-state-panel">
        <p className="app-state-eyebrow pretendard-bold-12">ACCESS DENIED</p>
        <h1 className="app-state-title pretendard-bold-24">관리자 권한이 없습니다</h1>
        <p className="app-state-copy pretendard-medium-14">{message}</p>
      </div>
    </AdminShell>
  );
}
