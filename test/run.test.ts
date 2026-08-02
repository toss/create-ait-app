import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { hasProjectFiles } from "../src/cli/run.js";

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
