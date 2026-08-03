import { describe, expect, it, vi } from "vitest";
import {
  configureNpmInstallCompatibility,
  configurePnpmInstallCompatibility,
  detectInvokedPackageManager,
  detectProjectPackageManager,
  installDependencies,
  packageManagerFromExecPath,
  packageManagerFromUserAgent,
  requiresLegacyNpmPeerDeps,
} from "../src/package-manager/package-manager.js";
import { runCommand } from "../src/system/command.js";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  APPS_IN_TOSS_WEB_FRAMEWORK_PACKAGE_NAME,
  APPS_IN_TOSS_WEB_FRAMEWORK_RELEASE_CHANNEL,
  APPS_IN_TOSS_WEB_FRAMEWORK_VERSION,
  isPrereleaseWebFrameworkChannel,
} from "../src/apps-in-toss/version-policy.js";

vi.mock("../src/system/command.js", () => ({
  runCommand: vi.fn(),
}));

describe("package manager detection", () => {
  it("reads package manager user agents", () => {
    expect(packageManagerFromUserAgent("pnpm/10.0.0 npm/? node/v24")).toBe("pnpm");
    expect(packageManagerFromUserAgent("bun/1.0.0")).toBeNull();
  });

  it("reads executable paths", () => {
    expect(packageManagerFromExecPath("/opt/yarn/bin/yarn.js")).toBe("yarn");
  });

  it("prioritizes explicit npm config", () => {
    expect(
      detectInvokedPackageManager({
        npm_config_pm: "npm",
        npm_config_user_agent: "pnpm/10.0.0",
      }),
    ).toBe("npm");
  });

  it("isolates installs from the invoking project's Node loader", () => {
    installDependencies("/tmp/example", "pnpm");

    expect(runCommand).toHaveBeenLastCalledWith({
      args: ["install"],
      command: "pnpm",
      cwd: "/tmp/example",
      unsetEnv: ["NODE_OPTIONS"],
    });
  });
});

describe("npm install compatibility", () => {
  it("works around known peer mismatches only", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "create-ait-pm-"));
    try {
      writeFileSync(
        path.join(directory, "package.json"),
        JSON.stringify({
          dependencies: { "@builder.io/qwik": "^1.20.0" },
          devDependencies: { vite: "^8.1.1" },
        }),
      );
      expect(requiresLegacyNpmPeerDeps(directory)).toBe(true);
      configureNpmInstallCompatibility(directory, "npm");
      expect(readFileSync(path.join(directory, ".npmrc"), "utf8")).toBe("legacy-peer-deps=true\n");

      writeFileSync(
        path.join(directory, "package.json"),
        JSON.stringify({
          dependencies: { "@builder.io/qwik": "^2.0.0" },
          devDependencies: { vite: "^8.1.1" },
        }),
      );
      rmSync(path.join(directory, ".npmrc"));
      expect(requiresLegacyNpmPeerDeps(directory)).toBe(false);
      configureNpmInstallCompatibility(directory, "npm");
      expect(existsSync(path.join(directory, ".npmrc"))).toBe(false);

      // 현재 릴리즈 채널이 실제로 심는 버전 + TDS 조합이에요. latest 채널이면
      // 정확 버전이라 프리릴리즈가 아니고, beta/rc 채널이면 프리릴리즈예요.
      writeFileSync(
        path.join(directory, "package.json"),
        JSON.stringify({
          dependencies: {
            [APPS_IN_TOSS_WEB_FRAMEWORK_PACKAGE_NAME]: APPS_IN_TOSS_WEB_FRAMEWORK_VERSION,
            "@toss/tds-mobile-ait": "latest",
          },
        }),
      );
      expect(requiresLegacyNpmPeerDeps(directory)).toBe(
        isPrereleaseWebFrameworkChannel(APPS_IN_TOSS_WEB_FRAMEWORK_RELEASE_CHANNEL),
      );

      writeFileSync(
        path.join(directory, "package.json"),
        JSON.stringify({
          dependencies: {
            "@apps-in-toss/web-framework": "3.0.0-rc.0",
            "@toss/tds-mobile-ait": "latest",
          },
        }),
      );
      expect(requiresLegacyNpmPeerDeps(directory)).toBe(true);
    } finally {
      rmSync(directory, { force: true, recursive: true });
    }
  });
});

describe("pnpm install compatibility", () => {
  it("approves the known protobufjs build required by Apps in Toss", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "create-ait-pm-"));
    try {
      configurePnpmInstallCompatibility(directory, "pnpm");
      expect(readFileSync(path.join(directory, "pnpm-workspace.yaml"), "utf8")).toBe(
        "allowBuilds:\n  protobufjs: true\n",
      );
    } finally {
      rmSync(directory, { force: true, recursive: true });
    }
  });

  it("does not add pnpm configuration for other package managers", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "create-ait-pm-"));
    try {
      configurePnpmInstallCompatibility(directory, "yarn");
      expect(existsSync(path.join(directory, "pnpm-workspace.yaml"))).toBe(false);
    } finally {
      rmSync(directory, { force: true, recursive: true });
    }
  });

  it("merges the allowBuilds entry into an existing pnpm-workspace.yaml", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "create-ait-pm-"));
    try {
      const existingWorkspace = "packages:\n  - packages/*\n";
      writeFileSync(path.join(directory, "pnpm-workspace.yaml"), existingWorkspace);
      configurePnpmInstallCompatibility(directory, "pnpm");
      expect(readFileSync(path.join(directory, "pnpm-workspace.yaml"), "utf8")).toBe(
        `${existingWorkspace}allowBuilds:\n  protobufjs: true\n`,
      );
    } finally {
      rmSync(directory, { force: true, recursive: true });
    }
  });

  it("leaves an existing protobufjs allowBuilds entry untouched", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "create-ait-pm-"));
    try {
      const existingWorkspace = "allowBuilds:\n  protobufjs: false\n";
      writeFileSync(path.join(directory, "pnpm-workspace.yaml"), existingWorkspace);
      configurePnpmInstallCompatibility(directory, "pnpm");
      expect(readFileSync(path.join(directory, "pnpm-workspace.yaml"), "utf8")).toBe(
        existingWorkspace,
      );
    } finally {
      rmSync(directory, { force: true, recursive: true });
    }
  });

  it("warns instead of overwriting an unrelated existing allowBuilds block", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "create-ait-pm-"));
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const existingWorkspace = "allowBuilds:\n  some-other-package: true\n";
      writeFileSync(path.join(directory, "pnpm-workspace.yaml"), existingWorkspace);
      configurePnpmInstallCompatibility(directory, "pnpm");
      expect(readFileSync(path.join(directory, "pnpm-workspace.yaml"), "utf8")).toBe(
        existingWorkspace,
      );
      expect(warnSpy).toHaveBeenCalledTimes(1);
    } finally {
      warnSpy.mockRestore();
      rmSync(directory, { force: true, recursive: true });
    }
  });
});

describe("detectProjectPackageManager", () => {
  it("returns null when nothing indicates a package manager", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "create-ait-pm-"));
    try {
      expect(detectProjectPackageManager(directory)).toBeNull();
    } finally {
      rmSync(directory, { force: true, recursive: true });
    }
  });

  it("reads the packageManager field before falling back to lockfiles", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "create-ait-pm-"));
    try {
      writeFileSync(
        path.join(directory, "package.json"),
        JSON.stringify({ packageManager: "pnpm@9.0.0" }),
      );
      writeFileSync(path.join(directory, "yarn.lock"), "");
      expect(detectProjectPackageManager(directory)).toBe("pnpm");

      writeFileSync(
        path.join(directory, "package.json"),
        JSON.stringify({ packageManager: "yarn@4.1.0" }),
      );
      expect(detectProjectPackageManager(directory)).toBe("yarn");

      writeFileSync(
        path.join(directory, "package.json"),
        JSON.stringify({ packageManager: "npm@10.5.0" }),
      );
      expect(detectProjectPackageManager(directory)).toBe("npm");
    } finally {
      rmSync(directory, { force: true, recursive: true });
    }
  });

  it("falls back to lockfiles when the packageManager field is absent", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "create-ait-pm-"));
    try {
      writeFileSync(path.join(directory, "package.json"), JSON.stringify({}));

      writeFileSync(path.join(directory, "pnpm-lock.yaml"), "");
      expect(detectProjectPackageManager(directory)).toBe("pnpm");
      rmSync(path.join(directory, "pnpm-lock.yaml"));

      writeFileSync(path.join(directory, "yarn.lock"), "");
      expect(detectProjectPackageManager(directory)).toBe("yarn");
      rmSync(path.join(directory, "yarn.lock"));

      writeFileSync(path.join(directory, "package-lock.json"), "");
      expect(detectProjectPackageManager(directory)).toBe("npm");
    } finally {
      rmSync(directory, { force: true, recursive: true });
    }
  });

  it("falls back to lockfiles when package.json is malformed", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "create-ait-pm-"));
    try {
      writeFileSync(path.join(directory, "package.json"), "{ not valid json");
      writeFileSync(path.join(directory, "pnpm-lock.yaml"), "");
      expect(detectProjectPackageManager(directory)).toBe("pnpm");
    } finally {
      rmSync(directory, { force: true, recursive: true });
    }
  });

  it("returns null when package.json is malformed and no lockfile exists", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "create-ait-pm-"));
    try {
      writeFileSync(path.join(directory, "package.json"), "{ not valid json");
      expect(detectProjectPackageManager(directory)).toBeNull();
    } finally {
      rmSync(directory, { force: true, recursive: true });
    }
  });
});
