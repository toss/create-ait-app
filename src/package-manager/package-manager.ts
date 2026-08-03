import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  APPS_IN_TOSS_WEB_FRAMEWORK_PACKAGE_NAME,
  APPS_IN_TOSS_WEB_FRAMEWORK_RELEASE_CHANNEL,
  isPrereleaseWebFrameworkChannel,
} from "../apps-in-toss/version-policy.js";
import { readPackageJson } from "../project/package-json.js";
import { runCommand } from "../system/command.js";

export const PACKAGE_MANAGERS = ["npm", "yarn", "pnpm"] as const;
export type PackageManager = (typeof PACKAGE_MANAGERS)[number];

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
  const webFrameworkVersion = packageJson.dependencies?.[APPS_IN_TOSS_WEB_FRAMEWORK_PACKAGE_NAME];
  const usesTds = packageJson.dependencies?.["@toss/tds-mobile-ait"] != null;
  const usesPrereleaseWebFramework =
    (webFrameworkVersion === APPS_IN_TOSS_WEB_FRAMEWORK_RELEASE_CHANNEL &&
      isPrereleaseWebFrameworkChannel(APPS_IN_TOSS_WEB_FRAMEWORK_RELEASE_CHANNEL)) ||
    /-\w/.test(webFrameworkVersion ?? "");

  // create-vite 9.1.1 pairs Qwik 1.x (peer: Vite <8) with Vite 8.
  // The generated CSR app builds successfully, but npm otherwise rejects the
  // upstream dependency tree before Apps in Toss can be installed.
  const needsQwikCompatibility =
    qwikMajor !== null && qwikMajor < 2 && viteMajor !== null && viteMajor >= 8;

  // @toss/tds-mobile-ait accepts stable web-framework releases, but npm does not
  // consider a prerelease to satisfy that peer range and otherwise installs latest.
  const needsTdsPrereleaseCompatibility = usesTds && usesPrereleaseWebFramework;

  return needsQwikCompatibility || needsTdsPrereleaseCompatibility;
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

export function configurePnpmInstallCompatibility(
  targetDirectory: string,
  packageManager: PackageManager,
): void {
  if (packageManager !== "pnpm") {
    return;
  }

  const workspacePath = path.join(targetDirectory, "pnpm-workspace.yaml");

  // pnpm 11 rejects unreviewed dependency build scripts by default. protobufjs
  // is a transitive dependency of the pinned Apps in Toss framework and its
  // published postinstall is intentionally trusted by generated projects.
  if (!existsSync(workspacePath)) {
    writeFileSync(workspacePath, "allowBuilds:\n  protobufjs: true\n");
    return;
  }

  const current = readFileSync(workspacePath, "utf8");
  if (/^\s*protobufjs\s*:/m.test(current)) {
    return;
  }

  if (!/^allowBuilds\s*:/m.test(current)) {
    writeFileSync(
      workspacePath,
      `${current.trimEnd()}${current.trim() ? "\n" : ""}allowBuilds:\n  protobufjs: true\n`,
    );
    return;
  }

  // An `allowBuilds` block already exists but doesn't mention protobufjs.
  // We don't parse YAML, so we can't safely merge a nested key into an
  // unknown existing block — ask the user to add it instead of guessing.
  console.warn(
    `\n⚠️ ${path.relative(process.cwd(), workspacePath)}에 이미 allowBuilds 설정이 있어 protobufjs 항목을 자동으로 추가하지 못했어요. allowBuilds.protobufjs: true를 직접 추가해 주세요.`,
  );
}

export function detectProjectPackageManager(targetDirectory: string): PackageManager | null {
  const packageJsonPath = path.join(targetDirectory, "package.json");
  if (existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
        packageManager?: string;
      };
      const name = packageJson.packageManager?.split("@")[0];
      if (PACKAGE_MANAGERS.includes(name as PackageManager)) {
        return name as PackageManager;
      }
    } catch {
      // Brownfield target: package.json may be unreadable or malformed.
      // Fall through to lockfile-based detection instead of throwing.
    }
  }

  if (existsSync(path.join(targetDirectory, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(path.join(targetDirectory, "yarn.lock"))) return "yarn";
  if (existsSync(path.join(targetDirectory, "package-lock.json"))) return "npm";
  return null;
}

export function installDependencies(targetDirectory: string, packageManager: PackageManager): void {
  runCommand({
    args: ["install"],
    command: packageManager,
    cwd: targetDirectory,
    unsetEnv: ["NODE_OPTIONS"],
  });
}

export function runPackageScript(
  targetDirectory: string,
  packageManager: PackageManager,
  script: string,
): void {
  const args = packageManager === "npm" ? ["run", script] : [script];
  runCommand({
    args,
    command: packageManager,
    cwd: targetDirectory,
    unsetEnv: ["NODE_OPTIONS"],
  });
}
