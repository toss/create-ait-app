export { parseArgs, parseSampleIds, printHelp } from "./cli/args.js";
export {
  detectInvokedPackageManager,
  packageManagerFromExecPath,
  packageManagerFromUserAgent,
} from "./package-manager/package-manager.js";
export type { PackageManager } from "./package-manager/package-manager.js";
export type { FrameworkKind } from "./project/framework.js";
export {
  assertCsrViteProject,
  detectFramework,
  isSsrOnlyViteBuildCommand,
  isTypeScriptProject,
} from "./project/inspect-project.js";
export type { ProjectInspection } from "./project/inspect-project.js";
export type { PackageJson } from "./project/package-json.js";
export { applyProjectSamples } from "./scaffold/apply-project-samples.js";
export { createBaseProject, toNpmPackageName } from "./scaffold/create-base-project.js";
export type { BaseProject } from "./scaffold/create-base-project.js";
export { finalizeProject } from "./scaffold/finalize-project.js";
export { initializeAitProject } from "./scaffold/initialize-ait-project.js";
export { installProjectDependencies } from "./scaffold/install-project-dependencies.js";
export type { SampleId } from "./samples/apply-samples.js";
export { getSkillRoot, installProjectSkills, writeAiSkills } from "./skills/install-skills.js";
export type { AiTool } from "./skills/install-skills.js";
export {
  getBundledViteTemplates,
  getCreateViteVersion,
  getSupportedViteTemplates,
} from "./vite/create-vite.js";
