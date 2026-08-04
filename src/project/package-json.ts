import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export interface PackageJson {
  [key: string]: unknown;
  name?: string;
  packageManager?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
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
