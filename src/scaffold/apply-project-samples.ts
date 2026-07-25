import { readPackageJson, writePackageJson } from "../project/package-json.js";
import { applyTdsSamples, applyViteSamples, type SampleId } from "../samples/apply-samples.js";
import type { BaseProject } from "./create-base-project.js";

export function applyProjectSamples({
  baseProject,
  sampleIds,
  targetDirectory,
  useTds,
}: {
  baseProject: BaseProject;
  sampleIds: SampleId[];
  targetDirectory: string;
  useTds: boolean;
}): void {
  if (useTds) {
    applyTdsSamples(targetDirectory, sampleIds);
  } else {
    applyViteSamples({
      framework: baseProject.framework,
      isTypeScript: baseProject.inspection.isTypeScript,
      sampleIds,
      targetDirectory,
    });
  }

  const packageJson = readPackageJson(targetDirectory);
  if (packageJson.createAitApp) {
    packageJson.createAitApp.samples = sampleIds;
    if (sampleIds.length > 0) {
      packageJson.createAitApp.sampleShellManaged = true;
    }
    writePackageJson(targetDirectory, packageJson);
  }
}
