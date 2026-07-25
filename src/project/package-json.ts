import { readFileSync, writeFileSync } from "node:fs";
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
    originalScripts: {
      build: string;
      dev: string;
    };
    sampleShellManaged: boolean;
    samples?: SampleId[];
    source: "create-vite" | "tds-template";
    template: string | null;
  };
}

export function readPackageJson(targetDirectory: string): PackageJson {
  return JSON.parse(
    readFileSync(path.join(targetDirectory, "package.json"), "utf8"),
  ) as PackageJson;
}

export function writePackageJson(targetDirectory: string, packageJson: PackageJson): void {
  writeFileSync(
    path.join(targetDirectory, "package.json"),
    `${JSON.stringify(packageJson, null, 2)}\n`,
  );
}
