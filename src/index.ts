export { parseArgs, parseSampleIds, printHelp } from "./args.js";
export {
  assertCsrViteProject,
  detectFramework,
  isSsrOnlyViteBuildCommand,
  isTypeScriptProject,
} from "./csr.js";
export {
  detectInvokedPackageManager,
  packageManagerFromExecPath,
  packageManagerFromUserAgent,
} from "./package-manager.js";
export { createBaseProject, finalizeProject, toNpmPackageName } from "./scaffold.js";
export { getSkillRoot, writeAiSkills } from "./skills.js";
export {
  getBundledViteTemplates,
  getCreateViteVersion,
  getSupportedViteTemplates,
} from "./vite.js";
export type {
  AiTool,
  FrameworkKind,
  PackageJson,
  PackageManager,
  ProjectInspection,
  SampleId,
} from "./types.js";
