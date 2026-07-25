import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { assertCsrViteProject } from "./csr.js";
import { copyDirectory, readPackageJson, writePackageJson } from "./fs-utils.js";
import { configureNpmInstallCompatibility, installDependencies } from "./package-manager.js";
import { templatesDirectory } from "./paths.js";
import { applyTdsSamples, applyViteSamples } from "./samples.js";
import { pickPrimaryColor } from "./templates.js";
import type { FrameworkKind, PackageManager, ProjectInspection, SampleId } from "./types.js";
import { getCreateViteVersion, resolveViteTemplate, scaffoldWithCreateVite } from "./vite.js";

export interface BaseProject {
  framework: FrameworkKind;
  inspection: ProjectInspection;
  source: "create-vite" | "tds-template";
  template: string | null;
}

export function toNpmPackageName(input: string): string {
  const raw = String(input || "").trim();
  if (!raw) return "my-app";

  if (raw.startsWith("@")) {
    const slash = raw.indexOf("/");
    if (slash > 1) {
      return `${raw.slice(0, slash).toLowerCase()}/${toNpmPackageName(raw.slice(slash + 1))}`;
    }
  }

  return (
    raw
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9._-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^[._-]+/, "")
      .replace(/[._-]+$/, "") || "my-app"
  );
}

function createTdsProject(targetDirectory: string, packageName: string): BaseProject {
  const templateDirectory = path.join(templatesDirectory, "react-ts-tds");
  copyDirectory(templateDirectory, targetDirectory, { exclude: ["samples"] });

  const packageJson = readPackageJson(targetDirectory);
  packageJson.name = packageName;
  writePackageJson(targetDirectory, packageJson);

  const configPath = path.join(targetDirectory, "granite.config.ts");
  writeFileSync(
    configPath,
    readFileSync(configPath, "utf8")
      .replaceAll("{{APP_NAME}}", packageName)
      .replaceAll("{{PRIMARY_COLOR}}", pickPrimaryColor()),
  );

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

function writeGraniteConfig({
  appName,
  buildCommand,
  devCommand,
  targetDirectory,
}: {
  appName: string;
  buildCommand: string;
  devCommand: string;
  targetDirectory: string;
}): void {
  writeFileSync(
    path.join(targetDirectory, "granite.config.ts"),
    `import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: ${JSON.stringify(appName)},
  brand: {
    displayName: "앱 이름",
    primaryColor: ${JSON.stringify(pickPrimaryColor())},
    icon: "",
  },
  web: {
    host: "localhost",
    port: 5173,
    commands: {
      dev: ${JSON.stringify(devCommand)},
      build: ${JSON.stringify(buildCommand)},
    },
  },
  permissions: [],
  outdir: "dist",
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

플랫폼 설정은 \`granite.config.ts\`에서 관리해요.
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
    "@apps-in-toss/web-framework": "latest",
  };
  packageJson.scripts = {
    ...packageJson.scripts,
    build: "ait build",
    "build:vite": baseProject.inspection.originalBuildCommand,
    deploy: "ait deploy",
    dev: "granite dev",
    "dev:vite": baseProject.inspection.originalDevCommand,
  };
  packageJson.createAitApp = {
    createViteVersion: baseProject.source === "create-vite" ? getCreateViteVersion() : null,
    framework: baseProject.framework,
    originalScripts: {
      build: baseProject.inspection.originalBuildCommand,
      dev: baseProject.inspection.originalDevCommand,
    },
    sampleShellManaged: false,
    source: baseProject.source,
    template: baseProject.template,
  };
  writePackageJson(targetDirectory, packageJson);

  writeGraniteConfig({
    appName: packageName.split("/").at(-1) ?? packageName,
    buildCommand: baseProject.inspection.originalBuildCommand,
    devCommand: baseProject.inspection.originalDevCommand,
    targetDirectory,
  });
  updateReadme(targetDirectory, packageName, packageManager);
  configureNpmInstallCompatibility(targetDirectory, packageManager);
}

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

  if (sampleIds.length > 0) {
    const packageJson = readPackageJson(targetDirectory);
    if (packageJson.createAitApp) {
      packageJson.createAitApp.sampleShellManaged = true;
      writePackageJson(targetDirectory, packageJson);
    }
  }
}

export function installProjectDependencies({
  packageManager,
  skipInstall,
  targetDirectory,
}: {
  packageManager: PackageManager;
  skipInstall: boolean;
  targetDirectory: string;
}): void {
  if (!skipInstall) {
    installDependencies(targetDirectory, packageManager);
  }
}

export function finalizeProject({
  baseProject,
  packageManager,
  packageName,
  sampleIds,
  skipInstall,
  targetDirectory,
  useTds,
}: {
  baseProject: BaseProject;
  packageManager: PackageManager;
  packageName: string;
  sampleIds: SampleId[];
  skipInstall: boolean;
  targetDirectory: string;
  useTds: boolean;
}): void {
  initializeAitProject({
    baseProject,
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
  installProjectDependencies({
    packageManager,
    skipInstall,
    targetDirectory,
  });
}
