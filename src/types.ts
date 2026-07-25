export const PACKAGE_MANAGERS = ["npm", "yarn", "pnpm"] as const;
export const AI_TOOLS = ["cursor", "claude", "codex"] as const;
export const SAMPLE_IDS = ["iap", "iaa"] as const;

export type PackageManager = (typeof PACKAGE_MANAGERS)[number];
export type AiTool = (typeof AI_TOOLS)[number];
export type SampleId = (typeof SAMPLE_IDS)[number];
export type FrameworkKind =
  | "lit"
  | "preact"
  | "qwik"
  | "react"
  | "solid"
  | "svelte"
  | "vanilla"
  | "vue"
  | "unknown";

export interface PackageJson {
  [key: string]: unknown;
  name?: string;
  packageManager?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  createAitApp?: {
    createViteVersion: string | null;
    framework: FrameworkKind;
    originalScripts: {
      build: string;
      dev: string;
    };
    sampleShellManaged: boolean;
    source: "create-vite" | "tds-template";
    template: string | null;
  };
}

export interface ProjectInspection {
  framework: FrameworkKind;
  isTypeScript: boolean;
  packageJson: PackageJson;
  originalBuildCommand: string;
  originalDevCommand: string;
}
