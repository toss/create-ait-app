import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  APPS_IN_TOSS_WEB_FRAMEWORK_PACKAGE_NAME,
  APPS_IN_TOSS_WEB_FRAMEWORK_RELEASE_CHANNEL,
  APPS_IN_TOSS_WEB_FRAMEWORK_VERSION,
  isPrereleaseWebFrameworkChannel,
  resolveWebFrameworkSpecifier,
} from "../src/apps-in-toss/version-policy.js";
import { addProjectSamples } from "../src/scaffold/add-project-samples.js";
import { createBaseProject, normalizeProjectName } from "../src/scaffold/create-base-project.js";
import { applyProjectSamples } from "../src/scaffold/apply-project-samples.js";
import { initializeAitProject } from "../src/scaffold/initialize-ait-project.js";

describe("Apps in Toss web framework version policy", () => {
  it("supports beta, rc, and latest release channels", () => {
    expect(isPrereleaseWebFrameworkChannel("beta")).toBe(true);
    expect(isPrereleaseWebFrameworkChannel("rc")).toBe(true);
    expect(isPrereleaseWebFrameworkChannel("latest")).toBe(false);
  });

  it("resolves the latest channel to .github/version-pins/package.json's pinned version", () => {
    // 구현이 쓰는 것과 같은 JSON import를 재사용하지 않고, 독립적으로 다시 파싱해서
    // 잘못된 키를 참조하거나 버전을 하드코딩하는 등의 구현 회귀를 잡아낼 수 있게 해요.
    const repoRoot = path.resolve(import.meta.dirname, "..");
    const versionPinsPackageJson = JSON.parse(
      readFileSync(path.join(repoRoot, ".github", "version-pins", "package.json"), "utf8"),
    );
    const pinnedVersion =
      versionPinsPackageJson.dependencies[APPS_IN_TOSS_WEB_FRAMEWORK_PACKAGE_NAME];

    const resolved = resolveWebFrameworkSpecifier("latest");
    expect(resolved).toBe(pinnedVersion);
    expect(resolved).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("resolves beta/rc channels to their dist-tag string as-is", () => {
    expect(resolveWebFrameworkSpecifier("beta")).toBe("beta");
    expect(resolveWebFrameworkSpecifier("rc")).toBe("rc");
  });
});

describe("normalizeProjectName", () => {
  it("returns an empty string when nothing kebab-normalizable remains", () => {
    expect(normalizeProjectName("안녕하세요")).toBe("");
    expect(normalizeProjectName("...")).toBe("");
    expect(normalizeProjectName("")).toBe("");
  });

  it("keeps the ASCII-normalizable portion of a mixed name", () => {
    expect(normalizeProjectName("안녕-app")).toBe("app");
  });

  it("only lowercases a name that is already otherwise valid", () => {
    expect(normalizeProjectName("MyApp")).toBe("myapp");
  });

  it("normalizes spaces and punctuation into hyphens", () => {
    expect(normalizeProjectName("My App!")).toBe("my-app");
  });

  // packageName은 그대로 ait init --app-name에 전달되어 콘솔 appName이 되므로,
  // npm이 패키지 이름으로는 허용하는 "."과 "_"도 여기서 하이픈으로 접어서
  // packageName === appName을 항상 보장해요.
  it("folds dots and underscores into hyphens instead of merely lowercasing", () => {
    expect(normalizeProjectName("my.app")).toBe("my-app");
    expect(normalizeProjectName("my_app")).toBe("my-app");
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
    if (isPrereleaseWebFrameworkChannel(APPS_IN_TOSS_WEB_FRAMEWORK_RELEASE_CHANNEL)) {
      // beta/rc 채널은 dist-tag 문자열 그대로여야 해요.
      expect(packageJson.dependencies[APPS_IN_TOSS_WEB_FRAMEWORK_PACKAGE_NAME]).toBe(
        APPS_IN_TOSS_WEB_FRAMEWORK_RELEASE_CHANNEL,
      );
    } else {
      // latest 채널은 dist-tag가 아니라 정확 버전으로 고정되어야 해요.
      expect(packageJson.dependencies[APPS_IN_TOSS_WEB_FRAMEWORK_PACKAGE_NAME]).toMatch(
        /^\d+\.\d+\.\d+$/,
      );
    }
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
