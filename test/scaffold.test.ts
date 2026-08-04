import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  APPS_IN_TOSS_WEB_FRAMEWORK_PACKAGE_NAME,
  APPS_IN_TOSS_WEB_FRAMEWORK_VERSION,
  isPrereleaseWebFrameworkChannel,
} from "../src/apps-in-toss/version-policy.js";
import { addProjectSamples } from "../src/scaffold/add-project-samples.js";
import { createBaseProject, toNpmPackageName } from "../src/scaffold/create-base-project.js";
import { applyProjectSamples } from "../src/scaffold/apply-project-samples.js";
import { initializeAitProject } from "../src/scaffold/initialize-ait-project.js";

describe("Apps in Toss web framework version policy", () => {
  it("supports beta, rc, and latest release channels", () => {
    expect(isPrereleaseWebFrameworkChannel("beta")).toBe(true);
    expect(isPrereleaseWebFrameworkChannel("rc")).toBe(true);
    expect(isPrereleaseWebFrameworkChannel("latest")).toBe(false);
  });
});

describe("toNpmPackageName", () => {
  it("normalizes names and scopes", () => {
    expect(toNpmPackageName("My App!")).toBe("my-app");
    expect(toNpmPackageName("@Scope/My App")).toBe("@scope/my-app");
  });
});

describe("createBaseProject", () => {
  it("renames the TDS template _gitignore so the project ships a .gitignore", () => {
    const directory = path.join(mkdtempSync(path.join(tmpdir(), "create-ait-tds-ignore-")), "app");
    try {
      createBaseProject({
        packageName: "tds-app",
        targetDirectory: directory,
        useTds: true,
      });

      expect(existsSync(path.join(directory, "_gitignore"))).toBe(false);
      expect(readFileSync(path.join(directory, ".gitignore"), "utf8")).toContain("node_modules");
    } finally {
      rmSync(path.dirname(directory), { force: true, recursive: true });
    }
  });
});

describe("initializeAitProject", () => {
  it("overlays Apps in Toss while preserving Vite commands", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "create-ait-overlay-"));
    mkdirSync(path.join(directory, "src"));
    writeFileSync(path.join(directory, "index.html"), "");
    writeFileSync(path.join(directory, "src", "main.js"), "");
    writeFileSync(path.join(directory, "README.md"), "# Vite app\n");
    writeFileSync(
      path.join(directory, "package.json"),
      JSON.stringify({
        devDependencies: { vite: "9.0.0" },
        name: "fixture",
        scripts: { build: "vite build", dev: "vite --host" },
      }),
    );

    initializeAitProject({
      packageManager: "npm",
      packageName: "my-app",
      targetDirectory: directory,
    });

    const packageJson = JSON.parse(readFileSync(path.join(directory, "package.json"), "utf8"));
    // 스크립트는 건드리지 않아요. `&& ait build` 연결, deploy 스크립트,
    // apps-in-toss.config.ts 생성은 설치 뒤 실행되는 ait init이 담당해요.
    expect(packageJson.scripts).toEqual({
      build: "vite build",
      dev: "vite --host",
    });
    expect(packageJson.dependencies[APPS_IN_TOSS_WEB_FRAMEWORK_PACKAGE_NAME]).toBe(
      APPS_IN_TOSS_WEB_FRAMEWORK_VERSION,
    );
    expect(packageJson.createAitApp).toBeUndefined();
    expect(existsSync(path.join(directory, "README.md"))).toBe(true);
  });

  it("copies TDS sample assets from the React 18 template", () => {
    const directory = path.join(mkdtempSync(path.join(tmpdir(), "create-ait-tds-")), "app");
    try {
      const baseProject = createBaseProject({
        packageName: "tds-app",
        targetDirectory: directory,
        useTds: true,
      });

      initializeAitProject({
        packageManager: "npm",
        packageName: "tds-app",
        targetDirectory: directory,
      });
      applyProjectSamples({
        baseProject,
        sampleIds: [],
        targetDirectory: directory,
        useTds: true,
      });

      const appPath = path.join(directory, "src", "App.tsx");
      writeFileSync(
        appPath,
        readFileSync(appPath, "utf8").replace("반가워요", "사용자가 수정한 앱"),
      );
      addProjectSamples(directory, ["iap"]);
      addProjectSamples(directory, ["iaa"]);

      expect(existsSync(path.join(directory, "src", "hooks", "useInAppAds.tsx"))).toBe(true);
      expect(existsSync(path.join(directory, "src", "hooks", "useInAppPurchase.ts"))).toBe(true);
      expect(readFileSync(appPath, "utf8")).toContain("사용자가 수정한 앱");
      expect(readFileSync(appPath, "utf8")).toContain('import { useState } from "react";');
      expect(readFileSync(appPath, "utf8")).not.toContain("{{SAMPLE_");
      expect(readFileSync(appPath, "utf8")).toContain("create-ait-app:sample-imports:start");
      expect(
        JSON.parse(readFileSync(path.join(directory, "package.json"), "utf8")).createAitApp,
      ).toBeUndefined();
    } finally {
      rmSync(path.dirname(directory), { force: true, recursive: true });
    }
  });

  it("adds a sample to an existing TDS project", () => {
    const directory = path.join(mkdtempSync(path.join(tmpdir(), "create-ait-tds-add-")), "app");
    try {
      const baseProject = createBaseProject({
        packageName: "tds-app",
        targetDirectory: directory,
        useTds: true,
      });

      initializeAitProject({
        packageManager: "npm",
        packageName: "tds-app",
        targetDirectory: directory,
      });
      applyProjectSamples({
        baseProject,
        sampleIds: [],
        targetDirectory: directory,
        useTds: true,
      });
      addProjectSamples(directory, ["iap"]);

      expect(existsSync(path.join(directory, "src", "pages", "InAppPurchasePage.tsx"))).toBe(true);
      expect(readFileSync(path.join(directory, "src", "App.tsx"), "utf8")).toContain(
        "InAppPurchasePage",
      );
    } finally {
      rmSync(path.dirname(directory), { force: true, recursive: true });
    }
  });
});
