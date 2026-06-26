const { checkbox } = require("@inquirer/prompts");
const fs = require("fs");
const path = require("path");
const { TEMPLATES_DIR } = require("./templates");
const { applySamples } = require("./apply-samples");
const { formatProject } = require("./scaffold");
const {
  detectProject,
  getInstalledSampleIds,
} = require("./detect-project");

const SAMPLE_IDS = ["iap", "iaa"];

function parseAddSampleArgs(rest) {
  let targetDir = null;
  const samples = [];

  for (const token of rest) {
    const ids = token.split(",").filter(Boolean);
    if (ids.length > 0 && ids.every((id) => SAMPLE_IDS.includes(id))) {
      samples.push(...ids);
      continue;
    }

    if (targetDir !== null) {
      return { error: `알 수 없는 인수입니다: ${token}` };
    }

    targetDir = token;
  }

  return {
    targetDir: targetDir || ".",
    samples: [...new Set(samples)],
  };
}

async function runAddSample(cliArgs) {
  const parsed = parseAddSampleArgs(cliArgs._.slice(1));
  if (parsed.error) {
    console.error(`\n❌ ${parsed.error}`);
    process.exit(1);
  }

  const targetDir = path.resolve(
    process.cwd(),
    cliArgs.cwd || parsed.targetDir,
  );

  if (!fs.existsSync(targetDir)) {
    console.error(`\n❌ 디렉토리를 찾을 수 없어요: ${targetDir}`);
    process.exit(1);
  }

  let project;
  try {
    project = detectProject(targetDir);
  } catch (error) {
    console.error(`\n❌ ${error.message}`);
    process.exit(1);
  }

  const { templateId, template, packageManager } = project;
  const sampleConfig = template.sampleConfig;
  const validSamples = Object.keys(sampleConfig);
  const installedSampleIds = getInstalledSampleIds(targetDir, sampleConfig);

  let sampleChoices = [];
  const explicitSamples =
    cliArgs.sample.length > 0 ? cliArgs.sample : parsed.samples;

  if (explicitSamples.length > 0) {
    const invalid = explicitSamples.filter((id) => !validSamples.includes(id));
    if (invalid.length > 0) {
      console.error(
        `\n❌ 지원하지 않는 예제 코드입니다: ${invalid.join(", ")} (${validSamples.join(", ")} 중 선택)`,
      );
      process.exit(1);
    }
    sampleChoices = [...new Set(explicitSamples)];
  } else {
    const availableChoices = validSamples
      .filter((id) => !installedSampleIds.includes(id))
      .map((id) => ({
        name: sampleConfig[id].displayName,
        value: id,
      }));

    if (availableChoices.length === 0) {
      console.log("\n✅ 추가할 수 있는 예제 코드가 없어요. 이미 모두 추가되어 있어요.");
      return;
    }

    sampleChoices = await checkbox({
      message: "추가할 예제 코드를 선택하세요:",
      choices: availableChoices,
    });
  }

  const newSampleChoices = sampleChoices.filter(
    (id) => !installedSampleIds.includes(id),
  );
  const skipped = sampleChoices.filter((id) => installedSampleIds.includes(id));

  if (skipped.length > 0) {
    console.log(`\nℹ️  이미 추가된 예제는 건너뜁니다: ${skipped.join(", ")}`);
  }

  if (newSampleChoices.length === 0) {
    console.log("\n✅ 새로 추가할 예제 코드가 없어요.");
    return;
  }

  const templateDir = path.join(TEMPLATES_DIR, templateId);

  console.log(
    `\n📦 예제 코드를 추가합니다... (${newSampleChoices.join(", ")}, templates/${templateId})\n`,
  );

  try {
    applySamples({
      templateDir,
      targetDir,
      template,
      sampleChoices: newSampleChoices,
      mode: "merge",
    });

    formatProject(targetDir, packageManager);

    console.log(`
✅ 예제 코드가 추가되었습니다!

  추가된 예제: ${newSampleChoices.join(", ")}
  ${packageManager === "npm" ? "npm run dev" : `${packageManager} dev`}로 확인해 보세요.
`);
  } catch (error) {
    console.error("\n❌ 예제 코드 추가 중 오류가 발생했습니다:", error.message);
    process.exit(1);
  }
}

module.exports = { runAddSample };
