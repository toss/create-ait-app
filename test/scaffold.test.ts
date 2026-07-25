import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  createBaseProject,
  toNpmPackageName,
  type BaseProject,
} from "../src/scaffold/create-base-project.js";
import { finalizeProject } from "../src/scaffold/finalize-project.js";

describe("toNpmPackageName", () => {
  it("normalizes names and scopes", () => {
    expect(toNpmPackageName("My App!")).toBe("my-app");
    expect(toNpmPackageName("@Scope/My App")).toBe("@scope/my-app");
  });
});

describe("finalizeProject", () => {
  it("overlays Apps in Toss while preserving Vite commands", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "create-ait-overlay-"));
    mkdirSync(path.join(directory, "src"));
    writeFileSync(path.join(directory, "index.html"), "");
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
      build: "ait build",
      "build:vite": "vite build",
      dev: "granite dev",
      "dev:vite": "vite --host",
    });
    expect(packageJson.dependencies["@apps-in-toss/web-framework"]).toBe("latest");
    expect(packageJson.createAitApp.createViteVersion).toMatch(/^\d+\.\d+\.\d+$/);
    expect(packageJson.createAitApp.sampleShellManaged).toBe(false);
    expect(readFileSync(path.join(directory, "granite.config.ts"), "utf8")).toContain(
      'dev: "vite --host"',
    );
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

      finalizeProject({
        baseProject,
        packageManager: "npm",
        packageName: "tds-app",
        sampleIds: ["iap", "iaa"],
        skipInstall: true,
        targetDirectory: directory,
        useTds: true,
      });

      expect(existsSync(path.join(directory, "src", "hooks", "useInAppAds.tsx"))).toBe(true);
      expect(existsSync(path.join(directory, "src", "hooks", "useInAppPurchase.ts"))).toBe(true);
      expect(readFileSync(path.join(directory, "src", "App.tsx"), "utf8")).not.toContain(
        "{{SAMPLE_",
      );
      expect(
        JSON.parse(readFileSync(path.join(directory, "package.json"), "utf8")).createAitApp
          .sampleShellManaged,
      ).toBe(true);
    } finally {
      rmSync(path.dirname(directory), { force: true, recursive: true });
    }
  });
});
