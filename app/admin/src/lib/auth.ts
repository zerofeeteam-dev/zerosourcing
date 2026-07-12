import type { Session } from "@supabase/supabase-js";
import type { SupabaseConfig, SupabaseDisabledConfig } from "./supabase";

export type LoginCredentials = {
  readonly email: string;
  readonly password: string;
};

export type SessionRestoreResult =
  | { readonly kind: "blocked"; readonly setup: SupabaseDisabledConfig }
  | { readonly kind: "error"; readonly message: string }
  | { readonly kind: "success"; readonly session: Session | null };

export type SignInResult =
  | { readonly kind: "blocked"; readonly setup: SupabaseDisabledConfig }
  | { readonly kind: "error"; readonly message: string }
  | { readonly kind: "success"; readonly session: Session };

export type SignOutResult =
  | { readonly kind: "blocked"; readonly setup: SupabaseDisabledConfig }
  | { readonly kind: "error"; readonly message: string }
  | { readonly kind: "success" };

export type AdminCheckResult =
  | { readonly kind: "authorized" }
  | { readonly kind: "blocked"; readonly setup: SupabaseDisabledConfig }
  | { readonly kind: "denied"; readonly message: string }
  | { readonly kind: "error"; readonly message: string };

const deniedMessage = "관리자 권한이 없습니다. admin_users 등록 상태를 확인해주세요.";

export async function restoreSession(config: SupabaseConfig): Promise<SessionRestoreResult> {
  if (config.kind === "disabled") {
    return { kind: "blocked", setup: config };
  }

  const { data, error } = await config.client.auth.getSession();
  if (error) {
    return { kind: "error", message: error.message };
  }

  return { kind: "success", session: data.session };
}

export async function signInWithPassword(
  config: SupabaseConfig,
  credentials: LoginCredentials,
): Promise<SignInResult> {
  if (config.kind === "disabled") {
    return { kind: "blocked", setup: config };
  }

  const { data, error } = await config.client.auth.signInWithPassword(credentials);
  if (error) {
    return { kind: "error", message: error.message };
  }

  if (!data.session) {
    return { kind: "error", message: "로그인 세션을 확인할 수 없습니다." };
  }

  return { kind: "success", session: data.session };
}

export async function signOut(config: SupabaseConfig): Promise<SignOutResult> {
  if (config.kind === "disabled") {
    return { kind: "blocked", setup: config };
  }

  const { error } = await config.client.auth.signOut();
  if (error) {
    return { kind: "error", message: error.message };
  }

  return { kind: "success" };
}

export async function checkAdminUser(
  config: SupabaseConfig,
  session: Session,
): Promise<AdminCheckResult> {
  if (config.kind === "disabled") {
    return { kind: "blocked", setup: config };
  }

  const { data, error } = await config.client
    .from("admin_users")
    .select("id")
    .eq("id", session.user.id)
    .maybeSingle();

  if (error) {
    return { kind: "error", message: error.message };
  }

  if (!data) {
    return { kind: "denied", message: deniedMessage };
  }

  return { kind: "authorized" };
}
