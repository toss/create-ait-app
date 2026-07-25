import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { readPackageJson } from "./fs-utils.js";
import type { FrameworkKind, PackageJson, ProjectInspection } from "./types.js";

const SSR_DEPENDENCIES = [
  "@remix-run/dev",
  "@solidjs/start",
  "@sveltejs/kit",
  "@tanstack/start",
  "astro",
  "gatsby",
  "next",
  "nuxt",
] as const;

function allDependencies(packageJson: PackageJson): Record<string, string> {
  return {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };
}

export function detectFramework(packageJson: PackageJson): FrameworkKind {
  const dependencies = allDependencies(packageJson);
  if (dependencies.react) return "react";
  if (dependencies.preact) return "preact";
  if (dependencies.vue) return "vue";
  if (dependencies.svelte) return "svelte";
  if (dependencies["solid-js"]) return "solid";
  if (dependencies.lit) return "lit";
  if (dependencies["@builder.io/qwik"]) return "qwik";
  if (dependencies.vite) return "vanilla";
  return "unknown";
}

export function isTypeScriptProject(targetDirectory: string): boolean {
  if (existsSync(path.join(targetDirectory, "tsconfig.json"))) {
    return true;
  }

  const sourceDirectory = path.join(targetDirectory, "src");
  if (!existsSync(sourceDirectory)) {
    return false;
  }

  return readdirSync(sourceDirectory, { recursive: true }).some((entry) =>
    /\.(?:ts|tsx)$/.test(String(entry)),
  );
}

export function assertCsrViteProject(targetDirectory: string): ProjectInspection {
  if (!existsSync(path.join(targetDirectory, "package.json"))) {
    throw new Error("create-vite 결과에 package.json이 없습니다.");
  }
  if (!existsSync(path.join(targetDirectory, "index.html"))) {
    throw new Error("CSR 진입점 index.html이 없습니다. create-ait-app은 Vite CSR만 지원합니다.");
  }

  const packageJson = readPackageJson(targetDirectory);
  const dependencies = allDependencies(packageJson);
  if (!dependencies.vite) {
    throw new Error("Vite 의존성이 없습니다. create-ait-app은 Vite CSR만 지원합니다.");
  }

  const ssrDependency = SSR_DEPENDENCIES.find((dependency) => dependencies[dependency]);
  if (ssrDependency) {
    throw new Error(
      `SSR 프레임워크(${ssrDependency})가 감지되었습니다. create-ait-app은 CSR만 지원합니다.`,
    );
  }

  const originalDevCommand = packageJson.scripts?.dev;
  const originalBuildCommand = packageJson.scripts?.build;
  if (!originalDevCommand || !originalBuildCommand) {
    throw new Error("Vite dev/build 스크립트가 없습니다. create-ait-app은 Vite CSR만 지원합니다.");
  }

  return {
    framework: detectFramework(packageJson),
    isTypeScript: isTypeScriptProject(targetDirectory),
    originalBuildCommand,
    originalDevCommand,
    packageJson,
  };
}
