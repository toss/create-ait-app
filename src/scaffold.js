const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { copyDir } = require("./utils/copy-dir");
const { injectReactSamples, injectVanillaSamples } = require("./sample-inject");
const { SAMPLE_PRIMARY_COLOR } = require("./templates");

function scaffoldProject({
  templateDir,
  targetDir,
  template,
  sampleConfig,
  sampleChoices,
  projectName,
  packageName,
  packageManager,
}) {
  copyDir(templateDir, targetDir, { exclude: ["samples"] });

  const pkgPath = path.join(targetDir, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  pkg.name = packageName;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

  const configPath = path.join(targetDir, "granite.config.ts");
  const configContent = fs.readFileSync(configPath, "utf-8");
  fs.writeFileSync(
    configPath,
    configContent
      .replace("{{APP_NAME}}", projectName)
      .replace(
        "{{PRIMARY_COLOR}}",
        SAMPLE_PRIMARY_COLOR[
          Math.floor(Math.random() * SAMPLE_PRIMARY_COLOR.length)
        ],
      ),
  );

  const readmePath = path.join(targetDir, "README.md");
  const pmDev =
    packageManager === "npm" ? "npm run dev" : `${packageManager} dev`;
  const pmBuild =
    packageManager === "npm" ? "npm run build" : `${packageManager} build`;
  const pmDeploy =
    packageManager === "npm" ? "npm run deploy" : `${packageManager} deploy`;

  let readmeContent = fs.readFileSync(readmePath, "utf-8");
  readmeContent = readmeContent
    .replace(/\{\{APP_NAME\}\}/g, projectName)
    .replace(/\{\{PM_DEV\}\}/g, pmDev)
    .replace(/\{\{PM_BUILD\}\}/g, pmBuild)
    .replace(/\{\{PM_DEPLOY\}\}/g, pmDeploy);
  fs.writeFileSync(readmePath, readmeContent);

  const samplesDir = path.join(templateDir, "samples");
  for (const id of sampleChoices) {
    const sampleRoot = path.join(samplesDir, id);
    if (fs.existsSync(sampleRoot)) {
      copyDir(sampleRoot, targetDir);
    }
  }

  const appPath = path.join(targetDir, template.appFile);
  if (fs.existsSync(appPath)) {
    let appContent = fs.readFileSync(appPath, "utf-8");
    appContent = template.isVanilla
      ? injectVanillaSamples(appContent, sampleChoices, sampleConfig)
      : injectReactSamples(
          appContent,
          sampleChoices,
          sampleConfig,
          template.isTypeScript,
        );
    fs.writeFileSync(appPath, appContent);
  }
}

function installDependencies(targetDir, packageManager) {
  console.log(`📦 의존성을 설치합니다...\n`);

  const installCommands = {
    npm: "npm install",
    yarn: "yarn",
    pnpm: "pnpm install",
  };
  execSync(installCommands[packageManager], {
    stdio: "inherit",
    cwd: targetDir,
  });

  console.log(`\n📦 @apps-in-toss/web-framework 최신 버전을 설치합니다...\n`);

  const addCmd = { npm: "npm install", yarn: "yarn add", pnpm: "pnpm add" };
  execSync(`${addCmd[packageManager]} @apps-in-toss/web-framework@latest`, {
    stdio: "inherit",
    cwd: targetDir,
  });
}

function formatProject(targetDir, packageManager) {
  console.log(`\n📐 코드 포맷팅을 실행합니다...\n`);
  const formatCmd =
    packageManager === "npm" ? "npm run format" : `${packageManager} format`;
  execSync(formatCmd, { stdio: "inherit", cwd: targetDir });
}

module.exports = {
  scaffoldProject,
  installDependencies,
  formatProject,
};
