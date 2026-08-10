import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { APPS_IN_TOSS_WEB_FRAMEWORK_PACKAGE_NAME } from "../apps-in-toss/version-policy.js";
import { detectFramework, isTypeScriptProject } from "../project/inspect-project.js";
import { readPackageJson, writePackageJson, type PackageJson } from "../project/package-json.js";
import {
  applyTdsSamples,
  applyViteSamples,
  isUnmodifiedBundledTdsSampleEntry,
  SAMPLE_IDS,
  supportsSamples,
  type SampleId,
} from "../samples/apply-samples.js";
import type { FrameworkKind } from "../project/framework.js";
import { SAMPLE_IMPORT_MARKERS, SAMPLE_ROUTE_MARKERS } from "../samples/managed-sample-shell.js";
import { isUnmodifiedBundledViteSampleEntry } from "../vite/create-vite.js";

export interface SampleProject {
  framework: FrameworkKind;
  installedSampleIds: SampleId[];
  isTypeScript: boolean;
  sampleShellManaged: boolean;
  useTds: boolean;
}

export interface AddProjectSamplesResult {
  addedSampleIds: SampleId[];
  installedSampleIds: SampleId[];
  skippedSampleIds: SampleId[];
}

const TDS_PACKAGE_NAMES = ["@toss/tds-mobile-ait", "@toss/tds-mobile"];

const SAMPLE_ENTRY_CANDIDATES: Partial<
  Record<FrameworkKind, { isTypeScript: boolean; relativePath: string }[]>
> = {
  react: [
    { isTypeScript: true, relativePath: path.join("src", "App.tsx") },
    { isTypeScript: false, relativePath: path.join("src", "App.jsx") },
  ],
  vanilla: [
    { isTypeScript: true, relativePath: path.join("src", "main.ts") },
    { isTypeScript: false, relativePath: path.join("src", "main.js") },
  ],
};

function allDependencies(packageJson: PackageJson): Record<string, string> {
  return {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };
}

function isAitProject(targetDirectory: string, packageJson: PackageJson): boolean {
  return (
    Boolean(allDependencies(packageJson)[APPS_IN_TOSS_WEB_FRAMEWORK_PACKAGE_NAME]) ||
    existsSync(path.join(targetDirectory, "apps-in-toss.config.ts"))
  );
}

function hasManagedSampleShell(entryPath: string): boolean {
  const content = readFileSync(entryPath, "utf8");
  return [SAMPLE_IMPORT_MARKERS.start, SAMPLE_ROUTE_MARKERS.start].some((marker) =>
    content.includes(marker),
  );
}

function findSampleEntry(
  targetDirectory: string,
  framework: FrameworkKind,
): { entryPath: string; isTypeScript: boolean; sampleShellManaged: boolean } | null {
  const existing = (SAMPLE_ENTRY_CANDIDATES[framework] ?? [])
    .map((candidate) => ({
      entryPath: path.join(targetDirectory, candidate.relativePath),
      isTypeScript: candidate.isTypeScript,
    }))
    .filter((candidate) => existsSync(candidate.entryPath))
    .map((candidate) => ({
      ...candidate,
      sampleShellManaged: hasManagedSampleShell(candidate.entryPath),
    }));

  // TS/JS 엔트리가 둘 다 있으면 예제 관리 마커가 있는 쪽이 실제 엔트리다.
  return existing.find((candidate) => candidate.sampleShellManaged) ?? existing[0] ?? null;
}

function removeLegacyCreateAitAppMetadata(targetDirectory: string): void {
  const packageJson = readPackageJson(targetDirectory);
  if (!("createAitApp" in packageJson)) {
    return;
  }

  const { createAitApp: _legacyMetadata, ...rest } = packageJson;
  writePackageJson(targetDirectory, rest);
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
  if (!isAitProject(targetDirectory, packageJson)) {
    throw new Error("Apps in Toss 프로젝트에서만 예제 코드를 추가할 수 있어요.");
  }

  const dependencies = allDependencies(packageJson);
  const useTds = TDS_PACKAGE_NAMES.some((packageName) => Boolean(dependencies[packageName]));
  const framework = detectFramework(packageJson);
  if (!supportsSamples(framework, useTds)) {
    throw new Error("React, Vanilla, TDS 프로젝트에만 예제 코드를 추가할 수 있어요.");
  }

  const entry = findSampleEntry(targetDirectory, framework);
  return {
    framework,
    installedSampleIds: detectInstalledSampleIds(targetDirectory),
    isTypeScript: entry?.isTypeScript ?? isTypeScriptProject(targetDirectory),
    sampleShellManaged: entry?.sampleShellManaged ?? false,
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
    removeLegacyCreateAitAppMetadata(targetDirectory);
    return {
      addedSampleIds,
      installedSampleIds,
      skippedSampleIds,
    };
  }

  // 예제 없이 스캐폴드된 TDS 프로젝트는 App.tsx에 관리 마커가 없다(I2). 마커가
  // 없더라도 create-ait-app이 만든 그대로(App.tsx가 손대지 않은 상태)라면
  // 템플릿을 다시 렌더링해서 안전하게 첫 예제를 추가할 수 있다. 마커도 없고
  // 손댄 흔적도 있다면(직접 구성한 프로젝트이거나 스캐폴드 후 수정한 경우)
  // App.tsx를 템플릿으로 덮어쓰지 않도록 거절한다.
  if (
    project.useTds &&
    !project.sampleShellManaged &&
    !isUnmodifiedBundledTdsSampleEntry(targetDirectory)
  ) {
    throw new Error(
      "App 파일이 create-ait-app이 만든 초기 상태에서 수정되어 있거나 예제 코드 관리 구간이 없어서 안전하게 추가할 수 없어요. create-ait-app으로 만든 TDS 프로젝트에서만 예제 코드를 추가할 수 있어요.",
    );
  }

  if (
    !project.useTds &&
    !project.sampleShellManaged &&
    !isUnmodifiedBundledViteSampleEntry({
      framework: project.framework,
      isTypeScript: project.isTypeScript,
      targetDirectory,
      template: null,
    })
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

  removeLegacyCreateAitAppMetadata(targetDirectory);
  return {
    addedSampleIds,
    installedSampleIds,
    skippedSampleIds,
  };
}
