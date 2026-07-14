import { useCallback, useEffect, useState } from "react";
import { AdminRouteView } from "./AdminRouteView";
import { AccessDeniedView, ErrorView, LoadingView, SetupBlockedView } from "./AppStateViews";
import { AdminShell, type AdminNavItem } from "./components/admin/AdminShell";
import {
  checkAdminUser,
  restoreSession,
  signInWithPassword,
  signOut,
  type LoginCredentials,
} from "./lib/auth";
import {
  activeNavKeyForRoute,
  defaultAdminPath,
  loginPath,
  matchAdminRoute,
  type AdminRoute,
} from "./lib/router";
import { usePendingAssetNavigation } from "./navigation/PendingAssetNavigation";
import { useAdminNavigationController } from "./navigation/useAdminNavigationController";
import { supabaseConfig, type SupabaseDisabledConfig } from "./lib/supabase";
import { LoginPage } from "./pages/LoginPage";
import type { Session } from "@supabase/supabase-js";

type AuthState =
  | { readonly kind: "authorized"; readonly session: Session }
  | { readonly kind: "checking" }
  | { readonly kind: "denied"; readonly message: string; readonly session: Session }
  | { readonly kind: "error"; readonly message: string }
  | { readonly kind: "setupBlocked"; readonly setup: SupabaseDisabledConfig }
  | { readonly kind: "signedOut" };

async function authStateFromSession(session: Session | null): Promise<AuthState> {
  if (!session) {
    return { kind: "signedOut" };
  }

  const adminCheck = await checkAdminUser(supabaseConfig, session);

  if (adminCheck.kind === "authorized") {
    return { kind: "authorized", session };
  }

  if (adminCheck.kind === "blocked") {
    return { kind: "setupBlocked", setup: adminCheck.setup };
  }

  if (adminCheck.kind === "denied") {
    return { kind: "denied", message: adminCheck.message, session };
  }

  return { kind: "error", message: adminCheck.message };
}

async function initialAuthState(): Promise<AuthState> {
  const restored = await restoreSession(supabaseConfig);

  if (restored.kind === "blocked") {
    return { kind: "setupBlocked", setup: restored.setup };
  }

  if (restored.kind === "error") {
    return { kind: "error", message: restored.message };
  }

  return authStateFromSession(restored.session);
}

function routeFromWindow(): AdminRoute {
  return matchAdminRoute(window.location.pathname);
}

export function App() {
  const [route, setRoute] = useState<AdminRoute>(routeFromWindow);
  const [authState, setAuthState] = useState<AuthState>({ kind: "checking" });
  const [loginError, setLoginError] = useState<string>();
  const [isLoginSubmitting, setIsLoginSubmitting] = useState(false);
  const { announceBlockedAttempt, getPendingAssetCount } = usePendingAssetNavigation();
  const acceptCurrentRoute = useCallback(() => setRoute(routeFromWindow()), []);
  const navigate = useAdminNavigationController({
    announceBlockedAttempt,
    getPendingAssetCount,
    onRouteAccepted: acceptCurrentRoute,
  });

  useEffect(() => {
    if (supabaseConfig.kind === "disabled") {
      setAuthState({ kind: "setupBlocked", setup: supabaseConfig });
      return;
    }

    let isActive = true;

    void initialAuthState().then((nextState) => {
      if (isActive) setAuthState(nextState);
    });

    const { data } = supabaseConfig.client.auth.onAuthStateChange((_event, session) => {
      void authStateFromSession(session).then((nextState) => {
        if (isActive) setAuthState(nextState);
      });
    });

    return () => {
      isActive = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (authState.kind === "authorized" && route.id === "login") {
      navigate(defaultAdminPath, "replace");
      return;
    }

    if (authState.kind === "signedOut" && route.protected) {
      navigate(loginPath, "replace");
    }
  }, [authState.kind, navigate, route.id, route.protected]);

  const handleLogin = useCallback(
    async (credentials: LoginCredentials) => {
      setLoginError(undefined);
      setIsLoginSubmitting(true);

      const result = await signInWithPassword(supabaseConfig, credentials);

      if (result.kind === "blocked") {
        setAuthState({ kind: "setupBlocked", setup: result.setup });
        setIsLoginSubmitting(false);
        return;
      }

      if (result.kind === "error") {
        setLoginError(result.message);
        setIsLoginSubmitting(false);
        return;
      }

      const nextState = await authStateFromSession(result.session);
      setAuthState(nextState);
      setIsLoginSubmitting(false);

      if (nextState.kind === "authorized") {
        navigate(defaultAdminPath, "replace");
      }

      if (nextState.kind === "denied" || nextState.kind === "error") {
        setLoginError(nextState.message);
      }
    },
    [navigate],
  );

  const handleLogout = useCallback(() => {
    const runLogout = async () => {
      const result = await signOut(supabaseConfig);
      if (result.kind === "error") {
        setAuthState({ kind: "error", message: result.message });
        return;
      }

      setAuthState({ kind: "signedOut" });
      navigate(loginPath, "replace");
    };

    void runLogout();
  }, [navigate]);

  const handleShellNavigate = useCallback(
    (item: AdminNavItem) => {
      navigate(item.href);
    },
    [navigate],
  );

  if (route.id === "login") {
    return (
      <LoginPage
        authError={loginError}
        isLoading={isLoginSubmitting || authState.kind === "checking"}
        onSubmit={handleLogin}
        setupBlock={authState.kind === "setupBlocked" ? authState.setup : undefined}
      />
    );
  }

  if (authState.kind === "checking") {
    return <LoadingView />;
  }

  if (authState.kind === "setupBlocked") {
    return <SetupBlockedView setup={authState.setup} />;
  }

  if (authState.kind === "signedOut") {
    return <LoadingView />;
  }

  if (authState.kind === "error") {
    return <ErrorView message={authState.message} />;
  }

  const activeItem = activeNavKeyForRoute(route);

  if (authState.kind === "denied") {
    return (
      <AccessDeniedView
        activeItem={activeItem}
        message={authState.message}
        onLogout={handleLogout}
        onNavigate={handleShellNavigate}
      />
    );
  }

  return (
    <AdminShell activeItem={activeItem} onNavigate={handleShellNavigate}>
      <AdminRouteView onNavigate={navigate} route={route} />
    </AdminShell>
  );
}
