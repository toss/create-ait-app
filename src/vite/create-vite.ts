import { existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import type { FrameworkKind } from "../project/framework.js";
import { isSsrOnlyViteBuildCommand } from "../project/inspect-project.js";
import { readPackageJson } from "../project/package-json.js";
// 타입만 가져와요 — package-manager는 vite와 같은 계층이고, 여기서는 런타임
// 의존을 만들지 않아서 apps-in-toss/ait-init.ts의 기존 관례와 같은 방식이에요.
import type { PackageManager } from "../package-manager/package-manager.js";
import { runCommand } from "../system/command.js";
import { packageRoot } from "../system/paths.js";
import { getViteStarterTemplates } from "./starter-page.js";

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
  const starterTemplates = new Set(getViteStarterTemplates());

  return getBundledViteTemplates().filter((template) => {
    if (!starterTemplates.has(template)) {
      return false;
    }
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

const PNP_REQUIRE_HOOK_PATTERN = /(?:^|\s)--require[= ](\S*\.pnp\.cjs)/;
const PNP_LOADER_HOOK_PATTERN =
  /(?:^|\s)--(experimental-loader|loader)[= ](\S*\.pnp\.loader\.[cm]?js)/;

/**
 * `require.resolve("create-vite")`는 Yarn PnP 환경(이 저장소 자체를 PnP로
 * 개발/E2E 실행할 때 등)에서 .zip 안의 가상 파일을 가리킬 수 있어요. 새로
 * 스폰한 node 프로세스가 그 경로를 읽으려면 부모와 같은 PnP 훅이 필요한데,
 * 그 훅은 보통 Yarn이 NODE_OPTIONS로 주입해요. scaffoldWithCreateVite는
 * 임의의 NODE_OPTIONS가 create-vite로 새어 들어가지 않게 통째로 제거하는
 * 대신, 그 안의 PnP 훅만 뽑아 이 함수로 명시적 인자로 되살려요.
 */
export function extractPnpBootstrapArgs(nodeOptions: string | undefined): string[] {
  if (!nodeOptions) return [];

  const args: string[] = [];
  const requireMatch = nodeOptions.match(PNP_REQUIRE_HOOK_PATTERN);
  if (requireMatch) {
    args.push("--require", requireMatch[1]);
  }
  const loaderMatch = nodeOptions.match(PNP_LOADER_HOOK_PATTERN);
  if (loaderMatch) {
    args.push(`--${loaderMatch[1]}`, loaderMatch[2]);
  }
  return args;
}

export function scaffoldWithCreateVite(
  targetDirectory: string,
  template?: string,
  {
    packageManager,
    quiet,
  }: {
    packageManager?: PackageManager;
    quiet?: boolean;
  } = {},
): void {
  const createViteEntry = require.resolve("create-vite");
  const resolvedTemplate = resolveViteTemplate(template);
  mkdirSync(path.dirname(targetDirectory), { recursive: true });
  const args = [
    ...extractPnpBootstrapArgs(process.env.NODE_OPTIONS),
    createViteEntry,
    path.basename(targetDirectory),
    "--no-immediate",
  ];
  if (resolvedTemplate) {
    args.push("--template", resolvedTemplate, "--no-interactive");
  }

  runCommand({
    args,
    command: process.execPath,
    cwd: path.dirname(targetDirectory),
    // create-vite는 npm_config_user_agent의 첫 토큰만 보고 "Done. Now run:"
    // 안내에 쓸 패키지 매니저 이름을 정해요. 버전은 무시되니 자리표시자로 채워요.
    env: packageManager ? { npm_config_user_agent: `${packageManager}/0.0.0` } : undefined,
    quiet,
    // 호출 환경(예: yarn 안에서 실행)의 NODE_OPTIONS가 자식 create-vite
    // 프로세스로 새어 들어가지 않게 해요(위의 PnP 훅은 이미 인자로 되살렸어요).
    unsetEnv: ["NODE_OPTIONS"],
  });
}
