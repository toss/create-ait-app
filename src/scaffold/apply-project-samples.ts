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
    return;
  }

  applyViteSamples({
    framework: baseProject.framework,
    isTypeScript: baseProject.inspection.isTypeScript,
    sampleIds,
    targetDirectory,
  });
}
