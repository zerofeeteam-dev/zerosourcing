import { defineConfig, devices } from "@playwright/test";
import process from "node:process";

import {
  ADMIN_URL,
  readE2EEnvironment,
  WEB_URL,
} from "./tests/e2e/environment";
import { createIsolatedServerCommand } from "./tests/e2e/isolated-server-command";

const environment = readE2EEnvironment(process.env);
const adminServerCommand = createIsolatedServerCommand(
  "pnpm --filter admin exec vite --host 127.0.0.1 --port 3002 --mode e2e",
  ["VITE_SUPABASE_ANON_KEY", "VITE_SUPABASE_URL"],
);
const webServerCommand = createIsolatedServerCommand(
  "pnpm exec next dev --hostname 127.0.0.1 --port 3000",
  [
    "NEXT_TELEMETRY_DISABLED",
    "SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_URL",
    "__NEXT_PROCESSED_ENV",
  ],
);

export default defineConfig({
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  globalSetup: "./tests/e2e/global-setup.ts",
  globalTeardown: "./tests/e2e/global-teardown.ts",
  outputDir: "test-results/e2e",
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  reporter: [["list"]],
  retries: 0,
  testDir: "./tests/e2e",
  timeout: 120_000,
  use: {
    baseURL: WEB_URL,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
  webServer: [
    {
      command: adminServerCommand,
      env: {
        VITE_SUPABASE_ANON_KEY: environment.anonKey,
        VITE_SUPABASE_URL: environment.supabaseUrl,
      },
      reuseExistingServer: false,
      timeout: 120_000,
      url: `${ADMIN_URL}/login`,
    },
    {
      command: webServerCommand,
      env: {
        NEXT_TELEMETRY_DISABLED: "1",
        SUPABASE_PUBLISHABLE_KEY: environment.anonKey,
        SUPABASE_URL: environment.supabaseUrl,
        __NEXT_PROCESSED_ENV: "true",
      },
      reuseExistingServer: false,
      timeout: 120_000,
      url: WEB_URL,
    },
  ],
  workers: 1,
});
