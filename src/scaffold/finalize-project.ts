import type { PackageManager } from "../package-manager/package-manager.js";
import type { SampleId } from "../samples/apply-samples.js";
import { applyProjectSamples } from "./apply-project-samples.js";
import type { BaseProject } from "./create-base-project.js";
import { initializeAitProject } from "./initialize-ait-project.js";
import { installProjectDependencies } from "./install-project-dependencies.js";

export function finalizeProject({
  baseProject,
  packageManager,
  packageName,
  sampleIds,
  skipInstall,
  targetDirectory,
  useTds,
}: {
  baseProject: BaseProject;
  packageManager: PackageManager;
  packageName: string;
  sampleIds: SampleId[];
  skipInstall: boolean;
  targetDirectory: string;
  useTds: boolean;
}): void {
  initializeAitProject({
    baseProject,
    packageManager,
    packageName,
    targetDirectory,
  });
  applyProjectSamples({
    baseProject,
    sampleIds,
    targetDirectory,
    useTds,
  });
  installProjectDependencies({
    packageManager,
    skipInstall,
    targetDirectory,
  });
}
