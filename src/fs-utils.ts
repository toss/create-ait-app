import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import type { PackageJson } from "./types.js";

export function copyDirectory(
  source: string,
  destination: string,
  options: { exclude?: string[]; skipExisting?: boolean } = {},
): void {
  const { exclude = [], skipExisting = false } = options;
  mkdirSync(destination, { recursive: true });

  for (const entry of readdirSync(source, { withFileTypes: true })) {
    if (exclude.includes(entry.name)) {
      continue;
    }

    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, destinationPath, options);
    } else if (!skipExisting || !existsSync(destinationPath)) {
      copyFileSync(sourcePath, destinationPath);
    }
  }
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
