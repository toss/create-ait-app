import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { readPackageJson, writePackageJson } from "../src/project/package-json.js";

describe("writePackageJson", () => {
  it("preserves an existing file's indentation", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "create-ait-package-json-"));
    try {
      writeFileSync(
        path.join(directory, "package.json"),
        JSON.stringify({ name: "fixture" }, null, 4),
      );
      const packageJson = readPackageJson(directory);
      packageJson.name = "fixture-renamed";
      writePackageJson(directory, packageJson);

      const written = readFileSync(path.join(directory, "package.json"), "utf8");
      expect(written).toBe(`${JSON.stringify(packageJson, null, 4)}\n`);
      expect(written).toContain('\n    "name"');
    } finally {
      rmSync(directory, { force: true, recursive: true });
    }
  });

  it("preserves a tab-indented file's indentation", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "create-ait-package-json-"));
    try {
      writeFileSync(
        path.join(directory, "package.json"),
        JSON.stringify({ name: "fixture" }, null, "\t"),
      );
      const packageJson = readPackageJson(directory);
      writePackageJson(directory, packageJson);

      const written = readFileSync(path.join(directory, "package.json"), "utf8");
      expect(written).toBe(`${JSON.stringify(packageJson, null, "\t")}\n`);
    } finally {
      rmSync(directory, { force: true, recursive: true });
    }
  });

  it("defaults to 2-space indentation for a new file", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "create-ait-package-json-"));
    try {
      writePackageJson(directory, { name: "fixture" });

      const written = readFileSync(path.join(directory, "package.json"), "utf8");
      expect(written).toBe(`${JSON.stringify({ name: "fixture" }, null, 2)}\n`);
    } finally {
      rmSync(directory, { force: true, recursive: true });
    }
  });
});
