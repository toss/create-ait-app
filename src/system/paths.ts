import path from "node:path";
import { fileURLToPath } from "node:url";

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const isSourceModule = path.basename(moduleDirectory) === "system";

export const packageRoot = path.resolve(moduleDirectory, isSourceModule ? "../.." : "..");
export const assetsDirectory = path.join(packageRoot, "assets");
export const skillsDirectory = path.join(packageRoot, "skills");
export const templatesDirectory = path.join(packageRoot, "templates");
