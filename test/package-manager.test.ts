import { describe, expect, it } from "vitest";
import {
  configureNpmInstallCompatibility,
  detectInvokedPackageManager,
  packageManagerFromExecPath,
  packageManagerFromUserAgent,
  requiresLegacyNpmPeerDeps,
} from "../src/package-manager/package-manager.js";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  APPS_IN_TOSS_WEB_FRAMEWORK_PACKAGE_NAME,
  APPS_IN_TOSS_WEB_FRAMEWORK_VERSION,
  isPrereleaseWebFrameworkChannel,
} from "../src/apps-in-toss/version-policy.js";

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
        isPrereleaseWebFrameworkChannel(APPS_IN_TOSS_WEB_FRAMEWORK_VERSION),
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
