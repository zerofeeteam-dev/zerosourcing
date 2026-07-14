import process from "node:process";

export const LOCAL_SUPABASE_URL = "http://127.0.0.1:54321";
export const ADMIN_URL = "http://127.0.0.1:3002";
export const WEB_URL = "http://127.0.0.1:3000";

export const E2E_ADMIN_EMAIL = "e2e-admin@local.test";
export const E2E_ADMIN_PASSWORD = "Local-e2e-admin-2026!";

export type E2EEnvironment = {
  readonly anonKey: string;
  readonly serviceRoleKey: string;
  readonly supabaseUrl: typeof LOCAL_SUPABASE_URL;
};

export function assertLocalSupabaseUrl(
  value: string | undefined,
): asserts value is typeof LOCAL_SUPABASE_URL {
  if (value !== LOCAL_SUPABASE_URL) {
    throw new Error(
      `E2E_SUPABASE_URL must be exactly ${LOCAL_SUPABASE_URL}. Hosted Supabase projects are never allowed in this suite.`,
    );
  }
}

function requiredEnvironmentValue(
  environment: Readonly<Record<string, string | undefined>>,
  key: "E2E_SUPABASE_ANON_KEY" | "E2E_SUPABASE_SERVICE_ROLE_KEY",
): string {
  const value = environment[key]?.trim() ?? "";
  if (!value) {
    throw new Error(`${key} is required for the local content E2E suite.`);
  }
  return value;
}

export function readE2EEnvironment(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): E2EEnvironment {
  const supabaseUrl = environment.E2E_SUPABASE_URL;
  assertLocalSupabaseUrl(supabaseUrl);

  return {
    anonKey: requiredEnvironmentValue(environment, "E2E_SUPABASE_ANON_KEY"),
    serviceRoleKey: requiredEnvironmentValue(
      environment,
      "E2E_SUPABASE_SERVICE_ROLE_KEY",
    ),
    supabaseUrl,
  };
}
