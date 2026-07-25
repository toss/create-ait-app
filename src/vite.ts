import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { runCommand } from "./command.js";
import { packageRoot } from "./paths.js";
import { readPackageJson } from "./fs-utils.js";
import { isSsrOnlyViteBuildCommand } from "./csr.js";

const require = createRequire(import.meta.url);

export const VITE_TEMPLATE_ALIASES: Readonly<Record<string, string>> = {
  js: "vanilla",
  ts: "vanilla-ts",
};

export function getCreateViteVersion(): string {
  const packageJson = readPackageJson(packageRoot);
  const version = packageJson.dependencies?.["create-vite"];
  if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
    throw new Error("create-vite 의존성은 정확한 버전으로 고정해야 합니다.");
  }
  return version;
}

export function resolveViteTemplate(template?: string): string | undefined {
  return template ? (VITE_TEMPLATE_ALIASES[template] ?? template) : undefined;
}

export function getBundledViteTemplates(): string[] {
  const entry = require.resolve("create-vite");
  const root = path.dirname(entry);
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith("template-"))
    .map((entry) => entry.name.slice("template-".length))
    .sort();
}

export function getSupportedViteTemplates(): string[] {
  const createViteRoot = path.dirname(require.resolve("create-vite"));

  return getBundledViteTemplates().filter((template) => {
    const templateDirectory = path.join(createViteRoot, `template-${template}`);
    if (!existsSync(path.join(templateDirectory, "index.html"))) {
      return false;
    }

    const packageJson = readPackageJson(templateDirectory);
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };
    const buildCommand = packageJson.scripts?.build;

    return Boolean(
      dependencies.vite &&
      packageJson.scripts?.dev &&
      buildCommand &&
      !isSsrOnlyViteBuildCommand(buildCommand),
    );
  });
}

export function scaffoldWithCreateVite(targetDirectory: string, template?: string): void {
  const createViteEntry = require.resolve("create-vite");
  const resolvedTemplate = resolveViteTemplate(template);
  const args = [createViteEntry, path.basename(targetDirectory)];
  if (resolvedTemplate) {
    args.push("--template", resolvedTemplate);
  }

  runCommand({
    args,
    command: process.execPath,
    cwd: path.dirname(targetDirectory),
  });
}
