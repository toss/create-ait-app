import { installDependencies, type PackageManager } from "../package-manager/package-manager.js";

export function installProjectDependencies({
  packageManager,
  skipInstall,
  targetDirectory,
}: {
  packageManager: PackageManager;
  skipInstall: boolean;
  targetDirectory: string;
}): void {
  if (!skipInstall) {
    installDependencies(targetDirectory, packageManager);
  }
}
