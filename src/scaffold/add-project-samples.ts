import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { isTypeScriptProject } from "../project/inspect-project.js";
import { readPackageJson, writePackageJson } from "../project/package-json.js";
import {
  applyTdsSamples,
  applyViteSamples,
  SAMPLE_IDS,
  supportsSamples,
  type SampleId,
} from "../samples/apply-samples.js";
import type { FrameworkKind } from "../project/framework.js";

export interface SampleProject {
  framework: FrameworkKind;
  installedSampleIds: SampleId[];
  isTypeScript: boolean;
  useTds: boolean;
}

export interface AddProjectSamplesResult {
  addedSampleIds: SampleId[];
  installedSampleIds: SampleId[];
  skippedSampleIds: SampleId[];
}

function detectInstalledSampleIds(targetDirectory: string): SampleId[] {
  const pagesDirectory = path.join(targetDirectory, "src", "pages");
  if (!existsSync(pagesDirectory)) {
    return [];
  }

  const pageFiles = readdirSync(pagesDirectory);
  return SAMPLE_IDS.filter((sampleId) => {
    const pageName = sampleId === "iap" ? "InAppPurchasePage" : "InAppAdsPage";
    return pageFiles.some((fileName) => fileName.startsWith(`${pageName}.`));
  });
}

export function inspectSampleProject(targetDirectory: string): SampleProject {
  if (!existsSync(path.join(targetDirectory, "package.json"))) {
    throw new Error("package.json을 찾을 수 없어요.");
  }

  const packageJson = readPackageJson(targetDirectory);
  const metadata = packageJson.createAitApp;
  if (!metadata) {
    throw new Error("create-ait-app으로 만든 프로젝트에서만 예제 코드를 추가할 수 있어요.");
  }

  const useTds = metadata.source === "tds-template";
  if (!supportsSamples(metadata.framework, useTds)) {
    throw new Error("React, Vanilla, TDS 프로젝트에만 예제 코드를 추가할 수 있어요.");
  }

  return {
    framework: metadata.framework,
    installedSampleIds: metadata.samples ?? detectInstalledSampleIds(targetDirectory),
    isTypeScript: isTypeScriptProject(targetDirectory),
    useTds,
  };
}

export function addProjectSamples(
  targetDirectory: string,
  requestedSampleIds: SampleId[],
): AddProjectSamplesResult {
  const project = inspectSampleProject(targetDirectory);
  const skippedSampleIds = requestedSampleIds.filter((sampleId) =>
    project.installedSampleIds.includes(sampleId),
  );
  const addedSampleIds = requestedSampleIds.filter(
    (sampleId) => !project.installedSampleIds.includes(sampleId),
  );
  const installedSampleIds = SAMPLE_IDS.filter(
    (sampleId) =>
      project.installedSampleIds.includes(sampleId) || addedSampleIds.includes(sampleId),
  );

  if (addedSampleIds.length === 0) {
    return {
      addedSampleIds,
      installedSampleIds,
      skippedSampleIds,
    };
  }

  if (project.useTds) {
    applyTdsSamples(targetDirectory, installedSampleIds);
  } else {
    applyViteSamples({
      framework: project.framework,
      isTypeScript: project.isTypeScript,
      sampleIds: installedSampleIds,
      targetDirectory,
    });
  }

  const packageJson = readPackageJson(targetDirectory);
  if (packageJson.createAitApp) {
    packageJson.createAitApp.sampleShellManaged = true;
    packageJson.createAitApp.samples = installedSampleIds;
    writePackageJson(targetDirectory, packageJson);
  }

  return {
    addedSampleIds,
    installedSampleIds,
    skippedSampleIds,
  };
}
