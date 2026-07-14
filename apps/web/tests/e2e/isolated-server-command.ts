const ENVIRONMENT_NAME = /^[A-Z_][A-Z0-9_]*$/u;

const MINIMAL_RUNTIME_ENVIRONMENT = [
  "PATH",
  "HOME",
  "TMPDIR",
  "LANG",
  "LC_ALL",
] as const;

function assertEnvironmentName(name: string): void {
  if (!ENVIRONMENT_NAME.test(name)) {
    throw new Error(`Unsafe child environment name: ${name}`);
  }
}

export function createIsolatedServerCommand(
  command: string,
  applicationEnvironment: readonly string[],
): string {
  if (!command.trim()) throw new Error("The isolated server command is empty.");

  const forwardedNames = [
    ...new Set([...MINIMAL_RUNTIME_ENVIRONMENT, ...applicationEnvironment]),
  ];
  forwardedNames.forEach(assertEnvironmentName);
  const forwardedEnvironment = forwardedNames.map(
    (name) => `${name}="$${name}"`,
  );

  return ["/usr/bin/env", "-i", ...forwardedEnvironment, command].join(" ");
}
