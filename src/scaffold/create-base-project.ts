import { renameSync } from "node:fs";
import path from "node:path";
import type { FrameworkKind } from "../project/framework.js";
import { assertCsrViteProject, type ProjectInspection } from "../project/inspect-project.js";
import { readPackageJson, writePackageJson } from "../project/package-json.js";
import { copyDirectory } from "../system/copy-directory.js";
import { templatesDirectory } from "../system/paths.js";
import { resolveViteTemplate, scaffoldWithCreateVite } from "../vite/create-vite.js";

export interface BaseProject {
  framework: FrameworkKind;
  inspection: ProjectInspection;
  source: "create-vite" | "tds-template";
  template: string | null;
}

// 프로젝트 이름을 kebab-case로 완전히 정규화해요. 이 이름은 npm 패키지
// 이름일 뿐 아니라 ait init --app-name을 거쳐 미니앱 콘솔 appName으로도
// 그대로 쓰이기 때문에(콘솔 규칙: /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/), 처음부터
// packageName === appName이 보장되도록 "."과 "_"도 하이픈으로 접어요. 입력은
// 항상 path.basename 결과라 슬래시가 섞인 @scope/name 형태는 들어올 수 없어요.
// 폴백이 없어서 비-ASCII 전용 이름처럼 정규화할 문자가 하나도 남지 않으면
// 빈 문자열을 돌려줘요 — 호출자가 그 빈 문자열을 보고 "이 이름은 쓸 수
// 없다"는 걸 판단할 수 있어야 하기 때문이에요(toss/create-ait-app#38).
export function normalizeProjectName(input: string): string {
  const raw = String(input || "").trim();
  if (!raw) return "";

  return raw
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

function createTdsProject(targetDirectory: string, packageName: string): BaseProject {
  const templateDirectory = path.join(templatesDirectory, "projects", "react-ts-tds");
  copyDirectory(templateDirectory, targetDirectory);
  // npm은 배포 시 .gitignore를 항상 제외해서 템플릿에는 _gitignore로 두고 복사 직후 되돌려요.
  renameSync(path.join(targetDirectory, "_gitignore"), path.join(targetDirectory, ".gitignore"));

  const packageJson = readPackageJson(targetDirectory);
  packageJson.name = packageName;
  writePackageJson(targetDirectory, packageJson);

  return {
    framework: "react",
    inspection: {
      framework: "react",
      isTypeScript: true,
      originalBuildCommand: "vite build",
      originalDevCommand: "vite dev",
      packageJson,
    },
    source: "tds-template",
    template: "react-ts",
  };
}

export function createBaseProject({
  packageName,
  targetDirectory,
  template,
  useTds,
}: {
  packageName: string;
  targetDirectory: string;
  template?: string;
  useTds: boolean;
}): BaseProject {
  if (useTds) {
    return createTdsProject(targetDirectory, packageName);
  }

  scaffoldWithCreateVite(targetDirectory, template);
  const inspection = assertCsrViteProject(targetDirectory);
  return {
    framework: inspection.framework,
    inspection,
    source: "create-vite",
    template: resolveViteTemplate(template) ?? null,
  };
}
