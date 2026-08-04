import { runAitInit, toAitAppName } from "../apps-in-toss/ait-init.js";
import { installDependencies, type PackageManager } from "../package-manager/package-manager.js";
import { readPackageJson, writePackageJson } from "../project/package-json.js";
import type { SampleId } from "../samples/apply-samples.js";
import { applyProjectSamples } from "./apply-project-samples.js";
import type { BaseProject } from "./create-base-project.js";
import { initializeAitProject } from "./initialize-ait-project.js";

export function finalizeProject({
  baseProject,
  packageManager,
  packageName,
  sampleIds,
  targetDirectory,
  useTds,
}: {
  baseProject: BaseProject;
  packageManager: PackageManager;
  packageName: string;
  sampleIds: SampleId[];
  targetDirectory: string;
  useTds: boolean;
}): void {
  initializeAitProject({
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
  installDependencies(targetDirectory, packageManager);

  // 설치가 끝나면 web-framework가 노출한 `ait init`에 나머지 설정을 위임해요.
  // apps-in-toss.config.ts 생성, `&& ait build` 연결, deploy 스크립트,
  // .gitignore, devtools 설치·번들러 플러그인 주입처럼 프레임워크 버전에
  // 종속된 부분이 설치된 버전과 항상 함께 움직여요.
  if (runAitInit({ appName: toAitAppName(packageName), packageManager, targetDirectory })) {
    // ait init이 다시 쓴 package.json의 포맷(끝 개행)을 되돌려요.
    writePackageJson(targetDirectory, readPackageJson(targetDirectory));
  }
}
