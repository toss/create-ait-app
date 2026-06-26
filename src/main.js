const { select, confirm, input, checkbox } = require("@inquirer/prompts");
const fs = require("fs");
const path = require("path");
const { parseArgs, printHelp } = require("./cli");
const {
  TEMPLATES_DIR,
  TEMPLATE_IDS,
  TEMPLATE_REGISTRY,
  TEMPLATE_CHOICES,
  resolveTemplateFolder,
} = require("./templates");
const { toNpmPackageName } = require("./utils/package-name");
const {
  VALID_PACKAGE_MANAGERS,
  detectInvokedPackageManager,
} = require("./detect-invoker");
const {
  scaffoldProject,
  installDependencies,
  formatProject,
} = require("./scaffold");
const { writeAiSkills } = require("./skills");

const { runAddSample } = require("./add-sample");

async function main() {
  const rawArgv = process.argv.slice(2);
  const cliArgs = parseArgs(rawArgv);

  if (process.env.DEBUG_AIT) {
    console.error("[debug] argv:", rawArgv);
    console.error("[debug] parsed:", cliArgs);
    console.error("[debug] npm_config_argv:", process.env.npm_config_argv);
    console.error("[debug] isTTY:", process.stdin.isTTY, process.stdout.isTTY);
  }

  if (cliArgs.help) {
    printHelp(cliArgs._[0]);
    return;
  }

  if (cliArgs._[0] === "add-sample") {
    await runAddSample(cliArgs);
    return;
  }

  const isInline = cliArgs.inline;

  const projectName =
    cliArgs._[0] ||
    (await input({
      message: "프로젝트 이름을 입력하세요:",
      required: true,
    }));

  const targetDir = path.resolve(process.cwd(), projectName);
  const packageName = toNpmPackageName(projectName);

  if (fs.existsSync(targetDir) && fs.readdirSync(targetDir).length > 0) {
    console.error(
      `\n❌ "${projectName}" 디렉토리가 이미 존재하고 비어있지 않습니다.`,
    );
    process.exit(1);
  }

  const validPms = VALID_PACKAGE_MANAGERS;
  const invokedPackageManager = detectInvokedPackageManager();

  let packageManager;

  if (cliArgs.pm) {
    if (!validPms.includes(cliArgs.pm)) {
      console.error(
        `\n❌ 지원하지 않는 패키지 매니저입니다: ${cliArgs.pm} (npm, yarn, pnpm 중 선택)`,
      );
      process.exit(1);
    }
    packageManager = cliArgs.pm;
  } else if (invokedPackageManager) {
    packageManager = invokedPackageManager;
  } else {
    packageManager = await select({
      message: "사용할 패키지 매니저를 선택하세요:",
      choices: [
        { name: "npm", value: "npm" },
        { name: "yarn", value: "yarn" },
        { name: "pnpm", value: "pnpm" },
      ],
    });
  }

  let baseTemplateId = null;

  if (cliArgs.template) {
    if (cliArgs.template === "react-ts-tds") {
      console.error(
        "\n❌ react-ts-tds는 더 이상 템플릿 이름으로 사용할 수 없습니다. --template react-ts --tds를 사용해 주세요.",
      );
      process.exit(1);
    }
    if (!TEMPLATE_IDS.includes(cliArgs.template)) {
      console.error(
        `\n❌ 지원하지 않는 템플릿입니다: ${cliArgs.template} (${TEMPLATE_IDS.join(", ")} 중 선택)`,
      );
      process.exit(1);
    }
    baseTemplateId = cliArgs.template;
  } else if (isInline) {
    baseTemplateId = "react-ts";
  } else {
    if (!process.stdin.isTTY || !process.stdout.isTTY) {
      console.error(
        "\n❌ 비대화형 환경에서는 --template 옵션으로 템플릿을 지정해 주세요.",
      );
      process.exit(1);
    }

    baseTemplateId = await select({
      message: "사용할 템플릿을 선택하세요:",
      choices: TEMPLATE_CHOICES,
    });
  }

  let useTds = false;
  if (cliArgs.tds) {
    useTds = baseTemplateId === "react-ts";
  } else if (!isInline && baseTemplateId === "react-ts") {
    useTds = await confirm({
      message:
        "TDS(Toss Design System)를 사용할까요? (앱인토스에 필수 아님, 기본값: 사용 안 함)",
      default: false,
    });
  }

  const templateId = resolveTemplateFolder(baseTemplateId, useTds);
  const template = TEMPLATE_REGISTRY[templateId];
  const templateDir = path.join(TEMPLATES_DIR, templateId);

  if (!fs.existsSync(templateDir)) {
    console.error(`\n❌ 템플릿을 찾을 수 없습니다: templates/${templateId}`);
    process.exit(1);
  }

  const sampleConfig = template.sampleConfig;

  let useSkills;
  let aiTool;
  if (cliArgs.skills) {
    useSkills = true;
    const validAiTools = ["cursor", "claude", "codex"];
    aiTool = cliArgs.ai;
    if (aiTool && !validAiTools.includes(aiTool)) {
      console.error(
        `\n❌ 지원하지 않는 AI 도구입니다: ${aiTool} (cursor, claude, codex 중 선택)`,
      );
      process.exit(1);
    }
    if (!aiTool) {
      aiTool = await select({
        message: "사용하는 AI 도구를 선택하세요:",
        choices: [
          { name: "Cursor", value: "cursor" },
          { name: "Claude Code", value: "claude" },
          { name: "Codex", value: "codex" },
        ],
      });
    }
  } else if (isInline) {
    useSkills = false;
  } else {
    aiTool = await select({
      message: "AI를 위한 skills를 추가할까요?",
      choices: [
        { name: "Cursor", value: "cursor" },
        { name: "Claude Code", value: "claude" },
        { name: "Codex", value: "codex" },
        { name: "선택안함", value: "none" },
      ],
    });
    useSkills = aiTool !== "none";
  }

  const validSamples = Object.keys(sampleConfig);
  let sampleChoices = [];
  if (cliArgs.sample.length > 0) {
    const invalid = cliArgs.sample.filter((s) => !validSamples.includes(s));
    if (invalid.length > 0) {
      console.error(
        `\n❌ 지원하지 않는 예제 코드입니다: ${invalid.join(", ")} (${validSamples.join(", ")} 중 선택)`,
      );
      process.exit(1);
    }
    sampleChoices = [...new Set(cliArgs.sample)];
  } else if (isInline) {
    sampleChoices = [];
  } else {
    const sampleChoiceList = validSamples.map((id) => ({
      name: sampleConfig[id].displayName,
      value: id,
    }));
    sampleChoices = await checkbox({
      message: "예제 코드를 추가할까요? (복수 선택 가능)",
      choices: sampleChoiceList,
    });
  }

  console.log(
    `\n🚀 프로젝트를 생성합니다... (templates/${templateId}${useTds ? ", TDS" : ""})\n`,
  );

  try {
    scaffoldProject({
      templateDir,
      targetDir,
      template,
      sampleChoices,
      projectName,
      packageName,
      packageManager,
    });

    installDependencies(targetDir, packageManager);

    if (useSkills) {
      await writeAiSkills({
        targetDir,
        aiTool,
        useTds: template.useTds,
      });
    }

    formatProject(targetDir, packageManager);

    console.log(`
✅ 프로젝트가 성공적으로 생성되었습니다!

  템플릿: templates/${templateId}
  cd ${projectName}
  ${packageManager === "npm" ? "npm run dev" : `${packageManager} dev`}
`);
  } catch (error) {
    console.error("\n❌ 프로젝트 생성 중 오류가 발생했습니다:", error.message);
    process.exit(1);
  }
}

module.exports = {
  main,
  TEMPLATE_IDS,
  TEMPLATE_REGISTRY,
  TEMPLATE_CHOICES,
  resolveTemplateFolder,
};
