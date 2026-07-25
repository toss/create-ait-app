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
