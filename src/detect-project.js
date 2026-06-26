const fs = require("fs");
const path = require("path");
const { TEMPLATE_REGISTRY } = require("./templates");

function detectPackageManager(targetDir) {
  if (fs.existsSync(path.join(targetDir, "pnpm-lock.yaml"))) return "pnpm";
  if (fs.existsSync(path.join(targetDir, "yarn.lock"))) return "yarn";
  if (fs.existsSync(path.join(targetDir, "package-lock.json"))) return "npm";
  return "npm";
}

function detectProject(targetDir) {
  if (!fs.existsSync(path.join(targetDir, "granite.config.ts"))) {
    throw new Error(
      "granite.config.ts를 찾을 수 없어요. create-ait-app으로 생성한 프로젝트인지 확인해 주세요.",
    );
  }

  if (!fs.existsSync(path.join(targetDir, "package.json"))) {
    throw new Error("package.json을 찾을 수 없어요.");
  }

  const pkg = JSON.parse(
    fs.readFileSync(path.join(targetDir, "package.json"), "utf-8"),
  );
  const srcDir = path.join(targetDir, "src");

  let templateId;

  if (fs.existsSync(path.join(srcDir, "App.tsx"))) {
    templateId = pkg.dependencies?.["@toss/tds-mobile"]
      ? "react-ts-tds"
      : "react-ts";
  } else if (fs.existsSync(path.join(srcDir, "App.jsx"))) {
    templateId = "react";
  } else if (fs.existsSync(path.join(srcDir, "app.ts"))) {
    templateId = "ts";
  } else if (fs.existsSync(path.join(srcDir, "app.js"))) {
    templateId = "js";
  } else {
    throw new Error("지원하지 않는 프로젝트 구조예요.");
  }

  const template = TEMPLATE_REGISTRY[templateId];
  if (!template) {
    throw new Error(`알 수 없는 템플릿이에요: ${templateId}`);
  }

  return {
    templateId,
    template,
    packageManager: detectPackageManager(targetDir),
  };
}

function getInstalledSampleIds(targetDir, sampleConfig) {
  const pagesDir = path.join(targetDir, "src/pages");
  const installed = [];

  for (const [id, config] of Object.entries(sampleConfig)) {
    const importPath = config.import.match(/from\s+["']([^"']+)["']/)?.[1];
    if (!importPath) continue;

    const relativePath = importPath.replace(/^\.\//, "");
    const candidates = [
      path.join(targetDir, "src", `${relativePath}.tsx`),
      path.join(targetDir, "src", `${relativePath}.ts`),
      path.join(targetDir, "src", `${relativePath}.jsx`),
      path.join(targetDir, "src", `${relativePath}.js`),
      path.join(pagesDir, path.basename(relativePath) + ".tsx"),
      path.join(pagesDir, path.basename(relativePath) + ".ts"),
      path.join(pagesDir, path.basename(relativePath) + ".jsx"),
      path.join(pagesDir, path.basename(relativePath) + ".js"),
    ];

    if (candidates.some((filePath) => fs.existsSync(filePath))) {
      installed.push(id);
    }
  }

  return installed;
}

module.exports = {
  detectProject,
  detectPackageManager,
  getInstalledSampleIds,
};
