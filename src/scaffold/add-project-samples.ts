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
import { getViteSampleEntryHash, isUnmodifiedBundledViteSampleEntry } from "../vite/create-vite.js";

export interface SampleProject {
  framework: FrameworkKind;
  installedSampleIds: SampleId[];
  isTypeScript: boolean;
  sampleEntryHash: string | null;
  sampleShellManaged: boolean;
  source: "create-vite" | "existing-vite" | "tds-template";
  template: string | null;
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
    isTypeScript: metadata.isTypeScript ?? isTypeScriptProject(targetDirectory),
    sampleEntryHash: metadata.sampleEntryHash ?? null,
    sampleShellManaged: metadata.sampleShellManaged === true,
    source: metadata.source,
    template: metadata.template,
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

  if (project.source === "existing-vite" && !project.sampleShellManaged) {
    throw new Error(
      "기존 Vite 프로젝트에 추가한 앱에는 예제 코드를 자동으로 넣을 수 없어요. App/main 진입 파일을 create-ait-app이 관리하지 않아서예요.",
    );
  }

  if (
    !project.useTds &&
    !project.sampleShellManaged &&
    (project.sampleEntryHash
      ? project.sampleEntryHash !==
        getViteSampleEntryHash({
          framework: project.framework,
          isTypeScript: project.isTypeScript,
          targetDirectory,
        })
      : !isUnmodifiedBundledViteSampleEntry({
          framework: project.framework,
          isTypeScript: project.isTypeScript,
          targetDirectory,
          template: project.template,
        }))
  ) {
    throw new Error(
      "App/main 파일이 Vite 초기 상태에서 수정되어 첫 예제 코드를 안전하게 추가할 수 없어요.",
    );
  }

  if (project.useTds) {
    applyTdsSamples(targetDirectory, installedSampleIds, {
      preserveExistingShell: project.sampleShellManaged,
    });
  } else {
    applyViteSamples({
      framework: project.framework,
      isTypeScript: project.isTypeScript,
      preserveExistingShell: project.sampleShellManaged,
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
