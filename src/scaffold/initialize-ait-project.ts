import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  configureNpmInstallCompatibility,
  configurePnpmInstallCompatibility,
  type PackageManager,
} from "../package-manager/package-manager.js";
import {
  AIT_BUILD_COMMAND,
  AIT_CONFIG_FILE_NAME,
  AIT_DEPLOY_COMMAND,
  AIT_SCRIPT_SLOT_BUILD_VITE,
  AIT_SCRIPT_SLOT_DEPLOY_ORIGINAL,
  AIT_SCRIPT_SLOT_DEV_VITE,
} from "../apps-in-toss/reserved-project-files.js";
import {
  APPS_IN_TOSS_WEB_FRAMEWORK_PACKAGE_NAME,
  APPS_IN_TOSS_WEB_FRAMEWORK_VERSION,
} from "../apps-in-toss/version-policy.js";
import { readPackageJson, writePackageJson } from "../project/package-json.js";
import { getCreateViteVersion, getViteSampleEntryHash } from "../vite/create-vite.js";
import type { BaseProject } from "./create-base-project.js";
import { pickPrimaryColor } from "./primary-color.js";

function writeAppsInTossConfig({
  appName,
  targetDirectory,
}: {
  appName: string;
  targetDirectory: string;
}): void {
  writeFileSync(
    path.join(targetDirectory, AIT_CONFIG_FILE_NAME),
    `import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: ${JSON.stringify(appName)},
  brand: {
    primaryColor: ${JSON.stringify(pickPrimaryColor())},
  },
  permissions: [],
  webBundleDir: "dist",
});
`,
  );
}

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

export function initializeAitProject({
  baseProject,
  packageManager,
  packageName,
  targetDirectory,
}: {
  baseProject: BaseProject;
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

  const currentDeploy = packageJson.scripts?.deploy;
  // Re-running this function on an already-initialized project sees
  // scripts.deploy already rewritten to "ait deploy"; fall back to whatever
  // was recorded on a previous run so that metadata isn't dropped.
  const originalDeploy =
    (currentDeploy != null && currentDeploy !== AIT_DEPLOY_COMMAND ? currentDeploy : undefined) ??
    packageJson.createAitApp?.originalScripts?.deploy ??
    packageJson.scripts?.[AIT_SCRIPT_SLOT_DEPLOY_ORIGINAL];
  const preservesOriginalDeploy = originalDeploy != null;

  packageJson.scripts = {
    ...packageJson.scripts,
    build: `${baseProject.inspection.originalBuildCommand} && ${AIT_BUILD_COMMAND}`,
    [AIT_SCRIPT_SLOT_BUILD_VITE]: baseProject.inspection.originalBuildCommand,
    ...(preservesOriginalDeploy ? { [AIT_SCRIPT_SLOT_DEPLOY_ORIGINAL]: originalDeploy } : {}),
    deploy: AIT_DEPLOY_COMMAND,
    dev: baseProject.inspection.originalDevCommand,
    [AIT_SCRIPT_SLOT_DEV_VITE]: baseProject.inspection.originalDevCommand,
  };
  packageJson.createAitApp = {
    createViteVersion: baseProject.source === "create-vite" ? getCreateViteVersion() : null,
    framework: baseProject.framework,
    isTypeScript: baseProject.inspection.isTypeScript,
    originalScripts: {
      build: baseProject.inspection.originalBuildCommand,
      ...(preservesOriginalDeploy ? { deploy: originalDeploy } : {}),
      dev: baseProject.inspection.originalDevCommand,
    },
    sampleEntryHash:
      baseProject.source === "create-vite"
        ? getViteSampleEntryHash({
            framework: baseProject.framework,
            isTypeScript: baseProject.inspection.isTypeScript,
            targetDirectory,
          })
        : null,
    sampleShellManaged: false,
    samples: [],
    source: baseProject.source,
    template: baseProject.template,
  };

  writeAppsInTossConfig({
    appName: packageName.split("/").at(-1) ?? packageName,
    targetDirectory,
  });
  writePackageJson(targetDirectory, packageJson);

  updateReadme(targetDirectory, packageName, packageManager);

  // init(기존 Vite 프로젝트 전환)에서는 README에 문서화한 대로 apps-in-toss.config.ts,
  // package.json, README.md만 바꿔요. 이 두 호환성 shim은 그린필드 스캐폴딩 전용으로,
  // 브라운필드 프로젝트에 .npmrc/pnpm-workspace.yaml 같은 선언되지 않은 파일을
  // 만들거나(특히 모노레포에서 워크스페이스 루트 인식을 깨뜨릴 수 있어요) 기존
  // .npmrc를 프로젝트 전역 설치 정책째로 바꾸는 부작용을 막기 위해 건너뛰어요.
  if (baseProject.source !== "existing-vite") {
    configureNpmInstallCompatibility(targetDirectory, packageManager);
    configurePnpmInstallCompatibility(targetDirectory, packageManager);
  }
}
