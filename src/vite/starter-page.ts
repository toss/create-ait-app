import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { FrameworkKind } from "../project/framework.js";
import { copyDirectory } from "../system/copy-directory.js";
import { templatesDirectory } from "../system/paths.js";

export interface StarterTemplateDefinition {
  entryPath: string;
  globalStylePath?: string;
  pageStylePath?: string;
  stylePath?: string;
}

const STARTER_TEMPLATES: Readonly<Record<string, StarterTemplateDefinition>> = {
  lit: { entryPath: "src/my-element.js", stylePath: "src/index.css" },
  "lit-ts": { entryPath: "src/my-element.ts", stylePath: "src/index.css" },
  preact: {
    entryPath: "src/app.jsx",
    globalStylePath: "src/index.css",
    pageStylePath: "src/app.css",
  },
  "preact-ts": {
    entryPath: "src/app.tsx",
    globalStylePath: "src/index.css",
    pageStylePath: "src/app.css",
  },
  qwik: {
    entryPath: "src/app.jsx",
    globalStylePath: "src/index.css",
    pageStylePath: "src/app.css",
  },
  "qwik-ts": {
    entryPath: "src/app.tsx",
    globalStylePath: "src/index.css",
    pageStylePath: "src/app.css",
  },
  react: {
    entryPath: "src/App.jsx",
    globalStylePath: "src/index.css",
    pageStylePath: "src/App.css",
  },
  "react-ts": {
    entryPath: "src/App.tsx",
    globalStylePath: "src/index.css",
    pageStylePath: "src/App.css",
  },
  solid: {
    entryPath: "src/App.jsx",
    globalStylePath: "src/index.css",
    pageStylePath: "src/App.css",
  },
  "solid-ts": {
    entryPath: "src/App.tsx",
    globalStylePath: "src/index.css",
    pageStylePath: "src/App.css",
  },
  svelte: { entryPath: "src/App.svelte", stylePath: "src/app.css" },
  "svelte-ts": { entryPath: "src/App.svelte", stylePath: "src/app.css" },
  vanilla: { entryPath: "src/main.js", stylePath: "src/style.css" },
  "vanilla-ts": { entryPath: "src/main.ts", stylePath: "src/style.css" },
  vue: { entryPath: "src/App.vue", stylePath: "src/style.css" },
  "vue-ts": { entryPath: "src/App.vue", stylePath: "src/style.css" },
};

const starterTemplatesDirectory = path.join(templatesDirectory, "projects", "vite-starters");
const sharedTemplatesDirectory = path.join(starterTemplatesDirectory, "_shared");

function getStarterTemplateDefinition(template: string): StarterTemplateDefinition {
  const definition = STARTER_TEMPLATES[template];
  if (!definition) {
    throw new Error(`Apps in Toss 시작 화면이 없는 Vite 프리셋이에요: ${template}`);
  }
  return definition;
}

export function getViteStarterTemplateDefinition(template: string): StarterTemplateDefinition {
  return { ...getStarterTemplateDefinition(template) };
}

export function getViteStarterTemplates(): string[] {
  return Object.keys(STARTER_TEMPLATES).sort();
}

export function applyViteStarterPage(targetDirectory: string, template: string): void {
  const definition = getStarterTemplateDefinition(template);
  copyDirectory(path.join(starterTemplatesDirectory, template), targetDirectory);

  if (definition.stylePath) {
    copyFileSync(
      path.join(sharedTemplatesDirectory, "combined.css"),
      path.join(targetDirectory, definition.stylePath),
    );
  }
  if (definition.globalStylePath) {
    copyFileSync(
      path.join(sharedTemplatesDirectory, "global.css"),
      path.join(targetDirectory, definition.globalStylePath),
    );
  }
  if (definition.pageStylePath) {
    copyFileSync(
      path.join(sharedTemplatesDirectory, "page.css"),
      path.join(targetDirectory, definition.pageStylePath),
    );
  }

  mkdirSync(path.join(targetDirectory, "public"), { recursive: true });
  copyFileSync(
    path.join(templatesDirectory, "projects", "react-ts-tds", "public", "appsintoss-logo.png"),
    path.join(targetDirectory, "public", "appsintoss-logo.png"),
  );
}

export function resolveViteStarterTemplate(
  framework: FrameworkKind,
  isTypeScript: boolean,
): string | null {
  if (framework === "unknown") return null;
  const template = `${framework}${isTypeScript ? "-ts" : ""}`;
  return STARTER_TEMPLATES[template] ? template : null;
}

export function isUnmodifiedViteStarterEntry({
  framework,
  isTypeScript,
  targetDirectory,
}: {
  framework: FrameworkKind;
  isTypeScript: boolean;
  targetDirectory: string;
}): boolean {
  const template = resolveViteStarterTemplate(framework, isTypeScript);
  if (!template) return false;

  const definition = STARTER_TEMPLATES[template];
  const sourcePath = path.join(starterTemplatesDirectory, template, definition.entryPath);
  const targetPath = path.join(targetDirectory, definition.entryPath);
  if (!existsSync(sourcePath) || !existsSync(targetPath)) return false;
  return readFileSync(sourcePath, "utf8") === readFileSync(targetPath, "utf8");
}
