import { renameSync } from "node:fs";
import path from "node:path";
import type { PackageManager } from "../package-manager/package-manager.js";
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
  packageManager,
  packageName,
  quiet,
  targetDirectory,
  template,
  useTds,
}: {
  packageManager?: PackageManager;
  packageName: string;
  quiet?: boolean;
  targetDirectory: string;
  template?: string;
  useTds: boolean;
}): BaseProject {
  if (useTds) {
    return createTdsProject(targetDirectory, packageName);
  }

  scaffoldWithCreateVite(targetDirectory, template, { packageManager, quiet });
  const inspection = assertCsrViteProject(targetDirectory);
  return {
    framework: inspection.framework,
    inspection,
    source: "create-vite",
    template: resolveViteTemplate(template) ?? null,
  };
}
