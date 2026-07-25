import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { readPackageJson } from "./fs-utils.js";
import { runCommand } from "./command.js";
import { PACKAGE_MANAGERS, type PackageManager } from "./types.js";

export function packageManagerFromUserAgent(userAgent?: string): PackageManager | null {
  const name = userAgent?.split(" ")[0]?.split("/")[0];
  return PACKAGE_MANAGERS.includes(name as PackageManager) ? (name as PackageManager) : null;
}

export function packageManagerFromExecPath(execPath = ""): PackageManager | null {
  if (/pnpm/i.test(execPath)) return "pnpm";
  if (/yarn/i.test(execPath)) return "yarn";
  if (/npm/i.test(execPath)) return "npm";
  return null;
}

export function detectInvokedPackageManager(
  environment: NodeJS.ProcessEnv = process.env,
): PackageManager | null {
  const configured = environment.npm_config_pm;
  if (PACKAGE_MANAGERS.includes(configured as PackageManager)) {
    return configured as PackageManager;
  }

  return (
    packageManagerFromUserAgent(environment.npm_config_user_agent) ??
    packageManagerFromExecPath(environment.npm_execpath) ??
    (environment.PNPM_PACKAGE_NAME || environment.PNPM_STORE_PATH ? "pnpm" : null)
  );
}

function dependencyMajor(version: string | undefined): number | null {
  const match = version?.match(/\d+/);
  return match ? Number(match[0]) : null;
}

export function requiresLegacyNpmPeerDeps(targetDirectory: string): boolean {
  const packageJson = readPackageJson(targetDirectory);
  const qwikMajor = dependencyMajor(packageJson.dependencies?.["@builder.io/qwik"]);
  const viteMajor = dependencyMajor(
    packageJson.devDependencies?.vite ?? packageJson.dependencies?.vite,
  );

  // create-vite 9.1.1 pairs Qwik 1.x (peer: Vite <8) with Vite 8.
  // The generated CSR app builds successfully, but npm otherwise rejects the
  // upstream dependency tree before Apps in Toss can be installed.
  return qwikMajor !== null && qwikMajor < 2 && viteMajor !== null && viteMajor >= 8;
}

export function configureNpmInstallCompatibility(
  targetDirectory: string,
  packageManager: PackageManager,
): void {
  if (packageManager !== "npm" || !requiresLegacyNpmPeerDeps(targetDirectory)) {
    return;
  }

  const npmrcPath = path.join(targetDirectory, ".npmrc");
  const current = existsSync(npmrcPath) ? readFileSync(npmrcPath, "utf8") : "";
  if (!/^\s*legacy-peer-deps\s*=/m.test(current)) {
    writeFileSync(
      npmrcPath,
      `${current.trimEnd()}${current.trim() ? "\n" : ""}legacy-peer-deps=true\n`,
    );
  }
}

export function installDependencies(targetDirectory: string, packageManager: PackageManager): void {
  runCommand({ args: ["install"], command: packageManager, cwd: targetDirectory });
}

export function runPackageScript(
  targetDirectory: string,
  packageManager: PackageManager,
  script: string,
): void {
  const args = packageManager === "npm" ? ["run", script] : [script];
  runCommand({ args, command: packageManager, cwd: targetDirectory });
}
