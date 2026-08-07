import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { assertChoice, buildScaffoldFailureGuidance, hasProjectFiles } from "../src/cli/run.js";

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
