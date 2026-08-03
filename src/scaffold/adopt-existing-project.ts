import path from "node:path";
import { assertAdoptableProject, assertCsrViteProject } from "../project/inspect-project.js";
import type { PackageJson } from "../project/package-json.js";
import type { BaseProject } from "./create-base-project.js";
import { toNpmPackageName } from "./create-base-project.js";

// init은 기존 프로젝트의 name을 그대로 존중해요 — 리네임하면 이미 게시된 패키지나
// 락파일, CI 참조를 깨뜨릴 수 있어요. name이 비어 있을 때만 디렉터리 이름에서 만들어요.
export function resolveExistingPackageName(
  packageJson: PackageJson,
  targetDirectory: string,
): string {
  const existingName = packageJson.name?.trim();
  if (existingName) {
    return existingName;
  }
  return toNpmPackageName(path.basename(targetDirectory));
}

export function adoptExistingProject(targetDirectory: string): BaseProject {
  assertAdoptableProject(targetDirectory);
  const inspection = assertCsrViteProject(targetDirectory);

  return {
    framework: inspection.framework,
    inspection,
    source: "existing-vite",
    template: null,
  };
}
