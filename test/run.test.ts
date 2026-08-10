import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { toAitAppName } from "../src/apps-in-toss/ait-init.js";
import {
  assertChoice,
  assertDerivablePackageName,
  buildPackageNameAdjustmentNotice,
  buildScaffoldFailureGuidance,
  deriveScaffoldPackageName,
  hasProjectFiles,
} from "../src/cli/run.js";

const temporaryDirectories = new Set<string>();

function createTemporaryDirectory(): string {
  const directory = mkdtempSync(path.join(tmpdir(), "create-ait-target-"));
  temporaryDirectories.add(directory);
  return directory;
}

afterEach(() => {
  for (const directory of temporaryDirectories) {
    rmSync(directory, { force: true, recursive: true });
  }
  temporaryDirectories.clear();
});

describe("hasProjectFiles", () => {
  it("allows an empty directory", () => {
    expect(hasProjectFiles(createTemporaryDirectory())).toBe(false);
  });

  it("allows a directory that only contains Git metadata", () => {
    const directory = createTemporaryDirectory();
    mkdirSync(path.join(directory, ".git"));

    expect(hasProjectFiles(directory)).toBe(false);
  });

  it("rejects a directory that contains a project file", () => {
    const directory = createTemporaryDirectory();
    mkdirSync(path.join(directory, ".git"));
    writeFileSync(path.join(directory, "README.md"), "# Existing project\n");

    expect(hasProjectFiles(directory)).toBe(true);
  });
});

describe("assertChoice", () => {
  it("passes through an exact match", () => {
    expect(assertChoice("react-ts", ["react-ts", "vue-ts"], "지원하지 않는 프리셋이에요")).toBe(
      "react-ts",
    );
  });

  it("hints at the lowercased match for a case mismatch", () => {
    expect(() =>
      assertChoice("React-TS", ["react-ts", "vue-ts"], "지원하지 않는 프리셋이에요"),
    ).toThrow('혹시 소문자 "react-ts"를 의도하셨나요?');
  });

  it("omits the hint when no lowercased match exists", () => {
    expect(() =>
      assertChoice("SVELTE-TS", ["react-ts", "vue-ts"], "지원하지 않는 프리셋이에요"),
    ).toThrow(/지원하지 않는 프리셋이에요: SVELTE-TS \(react-ts, vue-ts 중 선택\)$/);
  });
});

describe("buildScaffoldFailureGuidance", () => {
  it("tells the user the directory was preserved and how to resume", () => {
    const guidance = buildScaffoldFailureGuidance({
      packageManager: "npm",
      projectName: "my-app",
      targetDirectory: "/tmp/my-app",
    });

    expect(guidance).toContain("지우지 않았어요: /tmp/my-app");
    expect(guidance).toContain("cd my-app");
    expect(guidance).toContain("npm install");
    expect(guidance).not.toContain("ERR_PNPM_IGNORED_BUILDS");
  });

  it("adds the pnpm ignored-builds hint only for pnpm", () => {
    const guidance = buildScaffoldFailureGuidance({
      packageManager: "pnpm",
      projectName: "my-app",
      targetDirectory: "/tmp/my-app",
    });

    expect(guidance).toContain("pnpm install");
    expect(guidance).toContain("ERR_PNPM_IGNORED_BUILDS");
    expect(guidance).toContain("allowBuilds:");
  });

  it("omits the cd line when the target directory is the current directory", () => {
    const guidance = buildScaffoldFailureGuidance({
      packageManager: "npm",
      projectName: ".",
      targetDirectory: process.cwd(),
    });

    expect(guidance).not.toContain("cd ");
  });
});

describe("deriveScaffoldPackageName", () => {
  it("derives the name from a plain project directory argument", () => {
    expect(deriveScaffoldPackageName("My App")).toMatchObject({
      basename: "My App",
      packageName: "my-app",
    });
  });

  it("derives the name from the resolved current-directory basename for '.' (toss/create-ait-app#38)", () => {
    const directory = createTemporaryDirectory();
    const projectDirectory = path.join(directory, "Hello App");
    mkdirSync(projectDirectory);
    const originalCwd = process.cwd();
    process.chdir(projectDirectory);
    try {
      expect(deriveScaffoldPackageName(".")).toMatchObject({
        basename: "Hello App",
        packageName: "hello-app",
      });
    } finally {
      process.chdir(originalCwd);
    }
  });
});

describe("assertDerivablePackageName", () => {
  it("passes through when a package name was derived", () => {
    expect(() => assertDerivablePackageName("My App", "my-app")).not.toThrow();
  });

  it("rejects an empty package name with guidance on allowed characters", () => {
    expect(() => assertDerivablePackageName("안녕하세요", "")).toThrow(
      /안녕하세요.*영문 소문자, 숫자, 하이픈/s,
    );
  });
});

describe("buildPackageNameAdjustmentNotice", () => {
  it("stays silent for plain lowercasing", () => {
    expect(buildPackageNameAdjustmentNotice("MyApp", "myapp")).toBeNull();
  });

  it("announces the adjusted name when more than lowercasing happened", () => {
    const notice = buildPackageNameAdjustmentNotice("My App!", "my-app");
    expect(notice).toContain("My App!");
    expect(notice).toContain("my-app");
  });

  it("announces the adjustment for an underscored folder name (kebab-case normalization)", () => {
    const { basename, packageName } = deriveScaffoldPackageName("my_app");
    expect(packageName).toBe("my-app");
    const notice = buildPackageNameAdjustmentNotice(basename, packageName);
    expect(notice).toContain("my_app");
    expect(notice).toContain("my-app");
  });

  it("announces the adjustment for a dotted folder name (kebab-case normalization)", () => {
    const { basename, packageName } = deriveScaffoldPackageName("my.app");
    expect(packageName).toBe("my-app");
    const notice = buildPackageNameAdjustmentNotice(basename, packageName);
    expect(notice).toContain("my.app");
    expect(notice).toContain("my-app");
  });
});

describe("toAitAppName is a no-op on already-kebab package names", () => {
  it("holds for every packageName this build can derive, since normalizeProjectName already produces kebab-case (appName 1:1)", () => {
    for (const packageName of ["my-app", "hello-app", "app", "my-app-2"]) {
      expect(toAitAppName(packageName)).toBe(packageName);
    }
  });
});
