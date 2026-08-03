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
import { adoptExistingProject } from "../src/scaffold/adopt-existing-project.js";
import {
  createBaseProject,
  toNpmPackageName,
  type BaseProject,
} from "../src/scaffold/create-base-project.js";
import { finalizeProject } from "../src/scaffold/finalize-project.js";

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

describe("finalizeProject", () => {
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

    const baseProject: BaseProject = {
      framework: "vanilla",
      inspection: {
        framework: "vanilla",
        isTypeScript: false,
        originalBuildCommand: "vite build",
        originalDevCommand: "vite --host",
        packageJson: {},
      },
      source: "create-vite",
      template: "vanilla",
    };

    finalizeProject({
      baseProject,
      packageManager: "npm",
      packageName: "my-app",
      sampleIds: [],
      skipInstall: true,
      targetDirectory: directory,
      useTds: false,
    });

    const packageJson = JSON.parse(readFileSync(path.join(directory, "package.json"), "utf8"));
    expect(packageJson.scripts).toMatchObject({
      build: "vite build && ait build",
      "build:vite": "vite build",
      dev: "vite --host",
      "dev:vite": "vite --host",
    });
    expect(packageJson.dependencies[APPS_IN_TOSS_WEB_FRAMEWORK_PACKAGE_NAME]).toBe(
      APPS_IN_TOSS_WEB_FRAMEWORK_VERSION,
    );
    expect(packageJson.createAitApp.createViteVersion).toMatch(/^\d+\.\d+\.\d+$/);
    expect(packageJson.createAitApp.sampleEntryHash).toMatch(/^[a-f0-9]{64}$/);
    expect(packageJson.createAitApp.sampleShellManaged).toBe(false);
    expect(readFileSync(path.join(directory, "apps-in-toss.config.ts"), "utf8")).toContain(
      'webBundleDir: "dist"',
    );
    expect(existsSync(path.join(directory, "README.md"))).toBe(true);
    expect(packageJson.scripts.deploy).toBe("ait deploy");
    expect(packageJson.scripts["deploy:original"]).toBeUndefined();
    expect(packageJson.createAitApp.originalScripts.deploy).toBeUndefined();
  });

  it("preserves an existing deploy script instead of overwriting it", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "create-ait-deploy-"));
    try {
      mkdirSync(path.join(directory, "src"));
      writeFileSync(path.join(directory, "index.html"), "");
      writeFileSync(path.join(directory, "src", "main.js"), "");
      writeFileSync(
        path.join(directory, "package.json"),
        JSON.stringify({
          devDependencies: { vite: "9.0.0" },
          name: "fixture",
          scripts: { build: "vite build", deploy: "gh-pages -d dist", dev: "vite --host" },
        }),
      );

      const baseProject: BaseProject = {
        framework: "vanilla",
        inspection: {
          framework: "vanilla",
          isTypeScript: false,
          originalBuildCommand: "vite build",
          originalDevCommand: "vite --host",
          packageJson: {},
        },
        source: "create-vite",
        template: "vanilla",
      };

      finalizeProject({
        baseProject,
        packageManager: "npm",
        packageName: "my-app",
        sampleIds: [],
        skipInstall: true,
        targetDirectory: directory,
        useTds: false,
      });

      const packageJson = JSON.parse(readFileSync(path.join(directory, "package.json"), "utf8"));
      expect(packageJson.scripts.deploy).toBe("ait deploy");
      expect(packageJson.scripts["deploy:original"]).toBe("gh-pages -d dist");
      expect(packageJson.createAitApp.originalScripts.deploy).toBe("gh-pages -d dist");
    } finally {
      rmSync(directory, { force: true, recursive: true });
    }
  });

  it("keeps the recorded original deploy script on re-initialization", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "create-ait-deploy-rerun-"));
    try {
      mkdirSync(path.join(directory, "src"));
      writeFileSync(path.join(directory, "index.html"), "");
      writeFileSync(path.join(directory, "src", "main.js"), "");
      writeFileSync(
        path.join(directory, "package.json"),
        JSON.stringify({
          devDependencies: { vite: "9.0.0" },
          name: "fixture",
          scripts: { build: "vite build", deploy: "gh-pages -d dist", dev: "vite --host" },
        }),
      );

      const baseProject: BaseProject = {
        framework: "vanilla",
        inspection: {
          framework: "vanilla",
          isTypeScript: false,
          originalBuildCommand: "vite build",
          originalDevCommand: "vite --host",
          packageJson: {},
        },
        source: "create-vite",
        template: "vanilla",
      };

      const finalize = () =>
        finalizeProject({
          baseProject,
          packageManager: "npm",
          packageName: "my-app",
          sampleIds: [],
          skipInstall: true,
          targetDirectory: directory,
          useTds: false,
        });

      finalize();
      // Re-run against the now-initialized project (scripts.deploy is already
      // "ait deploy"); the previously recorded original must not be dropped.
      finalize();

      const packageJson = JSON.parse(readFileSync(path.join(directory, "package.json"), "utf8"));
      expect(packageJson.scripts.deploy).toBe("ait deploy");
      expect(packageJson.scripts["deploy:original"]).toBe("gh-pages -d dist");
      expect(packageJson.createAitApp.originalScripts.deploy).toBe("gh-pages -d dist");
    } finally {
      rmSync(directory, { force: true, recursive: true });
    }
  });

  it("copies TDS sample assets from the React 18 template", () => {
    const directory = path.join(mkdtempSync(path.join(tmpdir(), "create-ait-tds-")), "app");
    try {
      const baseProject = createBaseProject({
        packageName: "tds-app",
        targetDirectory: directory,
        useTds: true,
      });

      finalizeProject({
        baseProject,
        packageManager: "npm",
        packageName: "tds-app",
        sampleIds: [],
        skipInstall: true,
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
      expect(
        JSON.parse(readFileSync(path.join(directory, "package.json"), "utf8")).createAitApp
          .sampleShellManaged,
      ).toBe(true);
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

      finalizeProject({
        baseProject,
        packageManager: "npm",
        packageName: "tds-app",
        sampleIds: [],
        skipInstall: true,
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

describe("adoptExistingProject", () => {
  it("converts a brownfield Vite project without renaming it or losing user content", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "create-ait-brownfield-"));
    try {
      mkdirSync(path.join(directory, "src"));
      writeFileSync(path.join(directory, "index.html"), "");
      writeFileSync(path.join(directory, "src", "main.js"), "");
      writeFileSync(path.join(directory, "README.md"), "# Legacy App\n\nUser-authored docs.\n");
      writeFileSync(
        path.join(directory, "package.json"),
        JSON.stringify(
          {
            devDependencies: { vite: "9.0.0" },
            name: "legacy-app",
            scripts: { build: "vite build", deploy: "gh-pages -d dist", dev: "vite --host" },
          },
          null,
          4,
        ),
      );

      const baseProject = adoptExistingProject(directory);
      expect(baseProject.source).toBe("existing-vite");
      expect(baseProject.template).toBeNull();

      finalizeProject({
        baseProject,
        packageManager: "npm",
        packageName: "legacy-app",
        sampleIds: [],
        skipInstall: true,
        targetDirectory: directory,
        useTds: false,
      });

      const packageJsonRaw = readFileSync(path.join(directory, "package.json"), "utf8");
      const packageJson = JSON.parse(packageJsonRaw);

      expect(packageJson.name).toBe("legacy-app");
      expect(packageJson.scripts).toMatchObject({
        build: "vite build && ait build",
        "build:vite": "vite build",
        deploy: "ait deploy",
        "deploy:original": "gh-pages -d dist",
        dev: "vite --host",
        "dev:vite": "vite --host",
      });
      expect(packageJson.createAitApp.source).toBe("existing-vite");
      expect(packageJson.createAitApp.createViteVersion).toBeNull();
      expect(packageJson.createAitApp.sampleEntryHash).toBeNull();
      expect(packageJson.createAitApp.originalScripts.deploy).toBe("gh-pages -d dist");

      const readme = readFileSync(path.join(directory, "README.md"), "utf8");
      expect(readme).toContain("User-authored docs.");
      expect(readme).toContain("## Apps in Toss");

      expect(readFileSync(path.join(directory, "apps-in-toss.config.ts"), "utf8")).toContain(
        'webBundleDir: "dist"',
      );

      expect(packageJsonRaw).toContain('\n    "');
    } finally {
      rmSync(directory, { force: true, recursive: true });
    }
  });
});
