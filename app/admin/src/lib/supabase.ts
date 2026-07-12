import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type SupabaseEnvKey = "VITE_SUPABASE_ANON_KEY" | "VITE_SUPABASE_URL";

type SupabaseEnabledConfig = {
  readonly client: SupabaseClient;
  readonly kind: "enabled";
  readonly url: string;
};

export type SupabaseDisabledConfig = {
  readonly kind: "disabled";
  readonly message: string;
  readonly missing: readonly SupabaseEnvKey[];
};

export type SupabaseConfig = SupabaseDisabledConfig | SupabaseEnabledConfig;

const cookieStorage = {
  getItem(key: string): string | null {
    if (typeof document === "undefined") return null;

    const prefix = `${encodeURIComponent(key)}=`;
    const cookie = document.cookie.split("; ").find((item) => item.startsWith(prefix));
    if (!cookie) return null;

    return decodeURIComponent(cookie.slice(prefix.length));
  },
  removeItem(key: string): void {
    if (typeof document === "undefined") return;

    document.cookie = `${encodeURIComponent(key)}=; Max-Age=0; Path=/; SameSite=Lax`;
  },
  setItem(key: string, value: string): void {
    if (typeof document === "undefined") return;

    const secureAttribute = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(
      value,
    )}; Path=/; SameSite=Lax${secureAttribute}`;
  },
};

function readEnvValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function supabaseSetupMessage(missing: readonly SupabaseEnvKey[]): string {
  if (missing.length > 0) {
    return `Supabase 설정이 필요합니다. 누락된 환경 변수: ${missing.join(", ")}`;
  }

  return "VITE_SUPABASE_URL 값이 올바른 URL 형식이 아닙니다.";
}

function createSupabaseConfig(): SupabaseConfig {
  const url = readEnvValue(import.meta.env.VITE_SUPABASE_URL);
  const anonKey = readEnvValue(import.meta.env.VITE_SUPABASE_ANON_KEY);
  const missing: SupabaseEnvKey[] = [];
  if (!url) missing.push("VITE_SUPABASE_URL");
  if (!anonKey) missing.push("VITE_SUPABASE_ANON_KEY");

  if (missing.length > 0) {
    return {
      kind: "disabled",
      message: supabaseSetupMessage(missing),
      missing,
    };
  }

  if (!URL.canParse(url)) {
    return {
      kind: "disabled",
      message: supabaseSetupMessage([]),
      missing: [],
    };
  }

  return {
    client: createClient(url, anonKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
        storage: cookieStorage,
        storageKey: "zerosourcing-admin-auth",
      },
    }),
    kind: "enabled",
    url,
  };
}

export const supabaseConfig = createSupabaseConfig();
