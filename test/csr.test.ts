import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  assertAdoptableProject,
  assertCsrViteProject,
  isSsrOnlyViteBuildCommand,
} from "../src/project/inspect-project.js";

const temporaryDirectories: string[] = [];

function fixture(packageJson: unknown, withIndex = true): string {
  const directory = mkdtempSync(path.join(tmpdir(), "create-ait-csr-"));
  temporaryDirectories.push(directory);
  mkdirSync(path.join(directory, "src"));
  writeFileSync(path.join(directory, "package.json"), JSON.stringify(packageJson));
  writeFileSync(path.join(directory, "src", "main.ts"), "");
  if (withIndex) {
    writeFileSync(path.join(directory, "index.html"), '<div id="app"></div>');
  }
  return directory;
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

describe("assertCsrViteProject", () => {
  it("accepts a Vite client project and preserves its commands", () => {
    const directory = fixture({
      devDependencies: { typescript: "latest", vite: "latest" },
      scripts: { build: "tsc -b && vite build", dev: "vite" },
    });

    expect(assertCsrViteProject(directory)).toMatchObject({
      framework: "vanilla",
      isTypeScript: true,
      originalBuildCommand: "tsc -b && vite build",
      originalDevCommand: "vite",
    });
  });

  it("rejects a project without a client index", () => {
    const directory = fixture(
      {
        devDependencies: { vite: "latest" },
        scripts: { build: "vite build", dev: "vite" },
      },
      false,
    );
    expect(() => assertCsrViteProject(directory)).toThrow("클라이언트 진입점");
  });

  it("allows a client build followed by prerendering and hydration", () => {
    const directory = fixture({
      dependencies: { next: "latest" },
      devDependencies: { vite: "latest" },
      scripts: {
        build: "vite build && vite build --ssr && node scripts/prerender.mjs",
        dev: "vite",
      },
    });
    expect(() => assertCsrViteProject(directory)).not.toThrow();
  });

  it("rejects an SSR-only Vite build", () => {
    const directory = fixture({
      devDependencies: { vite: "latest" },
      scripts: { build: "vite build --ssr src/entry-server.ts", dev: "vite" },
    });
    expect(() => assertCsrViteProject(directory)).toThrow("SSR 전용 Vite build");
    expect(isSsrOnlyViteBuildCommand("vite build && vite build --ssr")).toBe(false);
    expect(isSsrOnlyViteBuildCommand("vite build --ssr=src/entry-server.ts")).toBe(true);
  });
});

describe("assertAdoptableProject", () => {
  it("accepts a plain Vite project", () => {
    const directory = fixture({
      devDependencies: { vite: "latest" },
      name: "legacy-app",
      scripts: { build: "vite build", dev: "vite" },
    });
    expect(() => assertAdoptableProject(directory)).not.toThrow();
  });

  it("rejects a directory without package.json", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "create-ait-adopt-"));
    temporaryDirectories.push(directory);
    expect(() => assertAdoptableProject(directory)).toThrow("package.json이 없어요");
  });

  it("rejects a project already set up by create-ait-app", () => {
    const directory = fixture({
      createAitApp: { framework: "vanilla", source: "create-vite" },
      devDependencies: { vite: "latest" },
      scripts: { build: "vite build", dev: "vite" },
    });
    expect(() => assertAdoptableProject(directory)).toThrow(
      "이미 create-ait-app으로 설정한 프로젝트예요",
    );
  });

  it("rejects a project that already depends on the web framework", () => {
    const directory = fixture({
      dependencies: { "@apps-in-toss/web-framework": "latest" },
      devDependencies: { vite: "latest" },
      scripts: { build: "vite build", dev: "vite" },
    });
    expect(() => assertAdoptableProject(directory)).toThrow(
      "이미 @apps-in-toss/web-framework 의존성이 있어요",
    );
  });

  it("rejects a project that already has an apps-in-toss config file", () => {
    const directory = fixture({
      devDependencies: { vite: "latest" },
      scripts: { build: "vite build", dev: "vite" },
    });
    writeFileSync(path.join(directory, "apps-in-toss.config.ts"), "");
    expect(() => assertAdoptableProject(directory)).toThrow("apps-in-toss.config.ts이 이미 있어요");
  });

  it("rejects a project whose scripts already invoke ait build/deploy", () => {
    const directory = fixture({
      devDependencies: { vite: "latest" },
      scripts: { build: "vite build", deploy: "ait deploy", dev: "vite" },
    });
    expect(() => assertAdoptableProject(directory)).toThrow(
      "scripts.deploy이 이미 ait 명령을 실행하고 있어요",
    );
  });

  it("rejects a project whose scripts already occupy the reserved build:vite/dev:vite/deploy:original slots", () => {
    const buildViteDirectory = fixture({
      devDependencies: { vite: "latest" },
      scripts: { build: "vite build", "build:vite": "echo custom", dev: "vite" },
    });
    expect(() => assertAdoptableProject(buildViteDirectory)).toThrow(
      "이 이름은 create-ait-app이 원래 스크립트를 옮겨 둘 자리예요",
    );

    const devViteDirectory = fixture({
      devDependencies: { vite: "latest" },
      scripts: { build: "vite build", dev: "vite", "dev:vite": "echo custom" },
    });
    expect(() => assertAdoptableProject(devViteDirectory)).toThrow(
      "이 이름은 create-ait-app이 원래 스크립트를 옮겨 둘 자리예요",
    );

    const deployOriginalDirectory = fixture({
      devDependencies: { vite: "latest" },
      scripts: { build: "vite build", "deploy:original": "echo custom", dev: "vite" },
    });
    expect(() => assertAdoptableProject(deployOriginalDirectory)).toThrow(
      "이 이름은 create-ait-app이 원래 스크립트를 옮겨 둘 자리예요",
    );
  });
});
