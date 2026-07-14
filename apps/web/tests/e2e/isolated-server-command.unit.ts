import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import adminViteConfig from "../../../admin/vite.config";
import { createIsolatedServerCommand } from "./isolated-server-command";

const FORBIDDEN_ENVIRONMENT = [
  "E2E_FORBIDDEN_SENTINEL",
  "E2E_SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_SUPABASE_SECRET_KEY",
  "NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY",
  "SLACK_BOT_TOKEN",
  "SLACK_CHANNEL_ID",
  "SUPABASE_SECRET_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "VITE_SUPABASE_SECRET_KEY",
  "VITE_SUPABASE_SERVICE_ROLE_KEY",
] as const;

describe("isolated E2E server command", () => {
  it("forwards only minimal runtime and explicit application keys", () => {
    const command = createIsolatedServerCommand(
      `node -e 'process.stdout.write(JSON.stringify(Object.keys(process.env).sort()))'`,
      ["E2E_ALLOWED_SENTINEL"],
    );
    const environment = {
      ...process.env,
      E2E_ALLOWED_SENTINEL: "allowed",
      ...Object.fromEntries(
        FORBIDDEN_ENVIRONMENT.map((name) => [name, "must-not-leak"]),
      ),
    };
    const childEnvironmentNames = JSON.parse(
      execSync(command, {
        encoding: "utf8",
        env: environment,
        shell: "/bin/sh",
      }),
    ) as string[];

    expect(childEnvironmentNames).toContain("E2E_ALLOWED_SENTINEL");
    expect(childEnvironmentNames).toContain("PATH");
    FORBIDDEN_ENVIRONMENT.forEach((name) => {
      expect(childEnvironmentNames).not.toContain(name);
    });
  });

  it("rejects shell-shaped environment names", () => {
    expect(() =>
      createIsolatedServerCommand("node --version", ["SAFE; touch leaked"]),
    ).toThrow("Unsafe child environment name");
  });

  it("prevents Next from applying the app dotenv files", () => {
    const script = [
      'const {createRequire}=require("node:module")',
      'const fromApp=createRequire(process.env.E2E_WEB_APP_DIR+"/package.json")',
      'const fromNext=createRequire(fromApp.resolve("next/package.json"))',
      'fromNext("@next/env").loadEnvConfig(process.env.E2E_WEB_APP_DIR,true,{info(){},error(){}})',
      "process.stdout.write(JSON.stringify(Object.keys(process.env).sort()))",
    ].join(";");
    const command = createIsolatedServerCommand(`node -e '${script}'`, [
      "E2E_WEB_APP_DIR",
      "__NEXT_PROCESSED_ENV",
    ]);
    const childEnvironmentNames = JSON.parse(
      execSync(command, {
        encoding: "utf8",
        env: {
          ...process.env,
          E2E_WEB_APP_DIR: fileURLToPath(new URL("../..", import.meta.url)),
          __NEXT_PROCESSED_ENV: "true",
        },
        shell: "/bin/sh",
      }),
    ) as string[];

    expect(childEnvironmentNames).toContain("__NEXT_PROCESSED_ENV");
    FORBIDDEN_ENVIRONMENT.forEach((name) => {
      expect(childEnvironmentNames).not.toContain(name);
    });
  });

  it("disables Vite dotenv loading only in Admin E2E mode", async () => {
    if (typeof adminViteConfig !== "function") {
      throw new Error("The Admin Vite config must remain mode-aware.");
    }
    const configEnvironment = {
      command: "serve" as const,
      isPreview: false,
      isSsrBuild: false,
    };
    const e2eConfig = await adminViteConfig({
      ...configEnvironment,
      mode: "e2e",
    });
    const developmentConfig = await adminViteConfig({
      ...configEnvironment,
      mode: "development",
    });

    expect(e2eConfig).toMatchObject({ envDir: false });
    expect(developmentConfig).not.toHaveProperty("envDir");
  });

  it("keeps both framework isolation switches wired to Playwright", () => {
    const playwrightConfig = readFileSync(
      new URL("../../playwright.config.ts", import.meta.url),
      "utf8",
    );

    expect(playwrightConfig).toContain("__NEXT_PROCESSED_ENV");
    expect(playwrightConfig).toContain("--mode e2e");
  });
});
