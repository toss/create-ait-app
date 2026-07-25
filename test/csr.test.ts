import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { mkdtempSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { assertCsrViteProject } from "../src/csr.js";

function fixture(packageJson: unknown, withIndex = true): string {
  const directory = mkdtempSync(path.join(tmpdir(), "create-ait-csr-"));
  mkdirSync(path.join(directory, "src"));
  writeFileSync(path.join(directory, "package.json"), JSON.stringify(packageJson));
  writeFileSync(path.join(directory, "src", "main.ts"), "");
  if (withIndex) {
    writeFileSync(path.join(directory, "index.html"), '<div id="app"></div>');
  }
  return directory;
}

describe("assertCsrViteProject", () => {
  it("accepts a Vite CSR and preserves its commands", () => {
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

  it("rejects a project without a CSR index", () => {
    const directory = fixture(
      {
        devDependencies: { vite: "latest" },
        scripts: { build: "vite build", dev: "vite" },
      },
      false,
    );
    expect(() => assertCsrViteProject(directory)).toThrow("CSR 진입점");
  });

  it("rejects known SSR frameworks", () => {
    const directory = fixture({
      dependencies: { next: "latest" },
      devDependencies: { vite: "latest" },
      scripts: { build: "vite build", dev: "vite" },
    });
    expect(() => assertCsrViteProject(directory)).toThrow("SSR 프레임워크(next)");
  });
});
