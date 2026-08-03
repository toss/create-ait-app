import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { SampleId } from "../samples/apply-samples.js";
import type { FrameworkKind } from "./framework.js";

export interface PackageJson {
  [key: string]: unknown;
  name?: string;
  packageManager?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  createAitApp?: {
    createViteVersion: string | null;
    framework: FrameworkKind;
    isTypeScript?: boolean;
    originalScripts: {
      build: string;
      deploy?: string;
      dev: string;
    };
    sampleEntryHash?: string | null;
    sampleShellManaged: boolean;
    samples?: SampleId[];
    source: "create-vite" | "existing-vite" | "tds-template";
    template: string | null;
  };
}

export function readPackageJson(targetDirectory: string): PackageJson {
  return JSON.parse(
    readFileSync(path.join(targetDirectory, "package.json"), "utf8"),
  ) as PackageJson;
}

function detectIndent(targetDirectory: string): string {
  const packageJsonPath = path.join(targetDirectory, "package.json");
  if (!existsSync(packageJsonPath)) {
    return "  ";
  }

  const match = readFileSync(packageJsonPath, "utf8").match(/\n([ \t]+)"/);
  return match?.[1] ?? "  ";
}

export function writePackageJson(targetDirectory: string, packageJson: PackageJson): void {
  const indent = detectIndent(targetDirectory);
  writeFileSync(
    path.join(targetDirectory, "package.json"),
    `${JSON.stringify(packageJson, null, indent)}\n`,
  );
}
