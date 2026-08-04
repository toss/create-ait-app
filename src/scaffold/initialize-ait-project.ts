import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  configureNpmInstallCompatibility,
  configurePnpmInstallCompatibility,
  type PackageManager,
} from "../package-manager/package-manager.js";
import {
  APPS_IN_TOSS_WEB_FRAMEWORK_PACKAGE_NAME,
  APPS_IN_TOSS_WEB_FRAMEWORK_VERSION,
} from "../apps-in-toss/version-policy.js";
import { readPackageJson, writePackageJson } from "../project/package-json.js";

function updateReadme(
  targetDirectory: string,
  appName: string,
  packageManager: PackageManager,
): void {
  const readmePath = path.join(targetDirectory, "README.md");
  const devCommand = packageManager === "npm" ? "npm run dev" : `${packageManager} dev`;
  const buildCommand = packageManager === "npm" ? "npm run build" : `${packageManager} build`;
  const deployCommand = packageManager === "npm" ? "npm run deploy" : `${packageManager} deploy`;
  const section = `# ${appName}

## Apps in Toss

\`\`\`bash
${devCommand}
${buildCommand}
${deployCommand}
\`\`\`

플랫폼 설정은 \`apps-in-toss.config.ts\`에서 관리해요.
`;

  if (!existsSync(readmePath)) {
    writeFileSync(readmePath, section);
    return;
  }

  let content = readFileSync(readmePath, "utf8");
  if (content.includes("{{APP_NAME}}")) {
    content = content
      .replaceAll("{{APP_NAME}}", appName)
      .replaceAll("{{PM_DEV}}", devCommand)
      .replaceAll("{{PM_BUILD}}", buildCommand)
      .replaceAll("{{PM_DEPLOY}}", deployCommand);
    writeFileSync(readmePath, content);
    return;
  }

  if (!content.includes("## Apps in Toss")) {
    writeFileSync(readmePath, `${content.trimEnd()}\n\n${section}`);
  }
}

// 스크립트 조작(`&& ait build` 연결, deploy 추가)과 apps-in-toss.config.ts
// 생성은 설치 뒤에 실행하는 `ait init`이 담당해요. 여기서는 init을 실행할 수
// 있게 만드는 준비(web-framework 의존성)와 스캐폴딩 고유의 일만 해요.
export function initializeAitProject({
  packageManager,
  packageName,
  targetDirectory,
}: {
  packageManager: PackageManager;
  packageName: string;
  targetDirectory: string;
}): void {
  const packageJson = readPackageJson(targetDirectory);
  packageJson.name = packageName;
  packageJson.dependencies = {
    ...packageJson.dependencies,
    [APPS_IN_TOSS_WEB_FRAMEWORK_PACKAGE_NAME]: APPS_IN_TOSS_WEB_FRAMEWORK_VERSION,
  };
  writePackageJson(targetDirectory, packageJson);

  updateReadme(targetDirectory, packageName, packageManager);
  configureNpmInstallCompatibility(targetDirectory, packageManager);
  configurePnpmInstallCompatibility(targetDirectory, packageManager);
}
