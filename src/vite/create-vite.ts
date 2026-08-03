import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import {
  detectInvokedPackageManager,
  type PackageManager,
} from "../package-manager/package-manager.js";
import type { FrameworkKind } from "../project/framework.js";
import { isSsrOnlyViteBuildCommand } from "../project/inspect-project.js";
import { readPackageJson } from "../project/package-json.js";
import { runCommand } from "../system/command.js";
import { packageRoot } from "../system/paths.js";

const require = createRequire(import.meta.url);

export const VITE_TEMPLATE_ALIASES: Readonly<Record<string, string>> = {
  js: "vanilla",
  ts: "vanilla-ts",
};

export function getCreateViteVersion(): string {
  const packageJson = readPackageJson(packageRoot);
  const version = packageJson.dependencies?.["create-vite"];
  if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
    throw new Error("create-vite 의존성은 정확한 버전으로 고정해야 해요.");
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

function getSampleEntryRelativePath(
  framework: FrameworkKind,
  isTypeScript: boolean,
): string | null {
  if (framework === "react") {
    return path.join("src", isTypeScript ? "App.tsx" : "App.jsx");
  }
  if (framework === "vanilla") {
    return path.join("src", isTypeScript ? "main.ts" : "main.js");
  }
  return null;
}

export function getBundledViteSampleEntryContent({
  framework,
  isTypeScript,
  template,
}: {
  framework: FrameworkKind;
  isTypeScript: boolean;
  template: string;
}): string | null {
  const relativePath = getSampleEntryRelativePath(framework, isTypeScript);
  if (!relativePath) return null;

  const entryPath = path.join(
    path.dirname(require.resolve("create-vite")),
    `template-${resolveViteTemplate(template)}`,
    relativePath,
  );
  return existsSync(entryPath) ? readFileSync(entryPath, "utf8") : null;
}

export function getViteSampleEntryHash({
  framework,
  isTypeScript,
  targetDirectory,
}: {
  framework: FrameworkKind;
  isTypeScript: boolean;
  targetDirectory: string;
}): string | null {
  const relativePath = getSampleEntryRelativePath(framework, isTypeScript);
  if (!relativePath) return null;

  const targetPath = path.join(targetDirectory, relativePath);
  if (!existsSync(targetPath)) return null;

  return createHash("sha256").update(readFileSync(targetPath)).digest("hex");
}

export function isUnmodifiedBundledViteSampleEntry({
  framework,
  isTypeScript,
  targetDirectory,
  template,
}: {
  framework: FrameworkKind;
  isTypeScript: boolean;
  targetDirectory: string;
  template: string | null;
}): boolean {
  const relativePath = getSampleEntryRelativePath(framework, isTypeScript);
  if (!relativePath) return false;

  const targetPath = path.join(targetDirectory, relativePath);
  if (!existsSync(targetPath)) return false;

  const targetContent = readFileSync(targetPath, "utf8");
  const candidateTemplates = template ? [template] : getBundledViteTemplates();
  return candidateTemplates.some(
    (candidate) =>
      getBundledViteSampleEntryContent({
        framework,
        isTypeScript,
        template: candidate,
      }) === targetContent,
  );
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

// require.resolve("create-vite") can point inside a Yarn PnP virtual (zip) path.
// Loading it from a freshly spawned node process needs that same PnP hook, which
// Yarn normally injects via NODE_OPTIONS — so we re-derive it as explicit argv
// before stripping NODE_OPTIONS itself from the child's environment below.
export function pnpBootstrapArgs(nodeOptions: string | undefined): string[] {
  if (!nodeOptions) return [];
  const args: string[] = [];
  const requireMatch = nodeOptions.match(/--require[= ](\S+\.pnp\.cjs)/);
  if (requireMatch) args.push("--require", requireMatch[1]);
  const loaderMatch = nodeOptions.match(/--experimental-loader[= ](\S+\.pnp\.loader\.mjs)/);
  if (loaderMatch) args.push("--experimental-loader", loaderMatch[1]);
  return args;
}

export function scaffoldWithCreateVite(
  targetDirectory: string,
  template?: string,
  options?: { packageManager?: PackageManager; quiet?: boolean },
): void {
  const createViteEntry = require.resolve("create-vite");
  const resolvedTemplate = resolveViteTemplate(template);
  mkdirSync(path.dirname(targetDirectory), { recursive: true });
  const args = [
    ...pnpBootstrapArgs(process.env.NODE_OPTIONS),
    createViteEntry,
    path.basename(targetDirectory),
    "--no-immediate",
  ];
  if (resolvedTemplate) {
    args.push("--template", resolvedTemplate, "--no-interactive");
  }

  // create-vite reads npm_config_user_agent to decide which package manager's
  // install/dev commands to print in its guidance, and (for yarn) whether to
  // treat it as legacy yarn 1.x. When the invoking tool already matches the
  // selected package manager, the real user agent (with its real version) is
  // more accurate than a synthesized one — only synthesize when they differ,
  // or when no invoking package manager could be detected at all.
  const invokedPackageManager = detectInvokedPackageManager();
  const selectedPackageManager = options?.packageManager;
  const shouldSynthesizeUserAgent =
    selectedPackageManager != null && selectedPackageManager !== invokedPackageManager;

  runCommand({
    args,
    command: process.execPath,
    cwd: path.dirname(targetDirectory),
    env: shouldSynthesizeUserAgent
      ? { npm_config_user_agent: `${selectedPackageManager}/0.0.0` }
      : undefined,
    quiet: options?.quiet,
    unsetEnv: ["NODE_OPTIONS"],
  });
}
