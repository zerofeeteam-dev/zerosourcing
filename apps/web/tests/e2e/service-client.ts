import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  assertLocalSupabaseUrl,
  E2E_ADMIN_EMAIL,
  E2E_ADMIN_PASSWORD,
  readE2EEnvironment,
  type E2EEnvironment,
} from "./environment";

export function createLocalServiceClient(
  environment: E2EEnvironment = readE2EEnvironment(),
): SupabaseClient {
  assertLocalSupabaseUrl(environment.supabaseUrl);

  return createClient(environment.supabaseUrl, environment.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

export async function findLocalE2EAdmin(
  client: SupabaseClient,
): Promise<{ readonly id: string; readonly email: string } | null> {
  const perPage = 200;

  for (let page = 1; page <= 100; page += 1) {
    const { data, error } = await client.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) throw error;

    const user = data.users.find(
      (candidate) => candidate.email === E2E_ADMIN_EMAIL,
    );
    if (user) return { id: user.id, email: E2E_ADMIN_EMAIL };
    if (data.users.length < perPage) return null;
  }

  throw new Error("Local Auth user pagination exceeded the E2E safety bound.");
}

export async function ensureLocalE2EAdmin(
  client: SupabaseClient,
): Promise<{ readonly id: string; readonly email: string }> {
  const existing = await findLocalE2EAdmin(client);
  let user = existing;

  if (existing) {
    const { data, error } = await client.auth.admin.updateUserById(
      existing.id,
      {
        email: E2E_ADMIN_EMAIL,
        email_confirm: true,
        password: E2E_ADMIN_PASSWORD,
      },
    );
    if (error) throw error;
    user = { id: data.user.id, email: E2E_ADMIN_EMAIL };
  } else {
    const { data, error } = await client.auth.admin.createUser({
      email: E2E_ADMIN_EMAIL,
      email_confirm: true,
      password: E2E_ADMIN_PASSWORD,
    });
    if (error) throw error;
    user = { id: data.user.id, email: E2E_ADMIN_EMAIL };
  }

  const { error: membershipError } = await client.from("admin_users").upsert(
    {
      email: user.email,
      id: user.id,
    },
    { onConflict: "id" },
  );
  if (membershipError) {
    const { error: cleanupError } = await client.auth.admin.deleteUser(user.id);
    if (cleanupError) {
      throw new AggregateError(
        [membershipError, cleanupError],
        "Local E2E admin membership setup and Auth cleanup both failed.",
      );
    }

    throw membershipError;
  }

  return user;
}
