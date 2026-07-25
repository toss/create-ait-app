import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import path from "node:path";

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
