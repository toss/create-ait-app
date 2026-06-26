const fs = require("fs");
const path = require("path");
const { copyDir } = require("./utils/copy-dir");
const { injectReactSamples, injectVanillaSamples } = require("./sample-inject");
const { mergeReactSamples, mergeVanillaSamples } = require("./sample-merge");

function applySamples({
  templateDir,
  targetDir,
  template,
  sampleChoices,
  mode = "inject",
}) {
  if (sampleChoices.length === 0) return;

  const samplesDir = path.join(templateDir, "samples");
  for (const id of sampleChoices) {
    const sampleRoot = path.join(samplesDir, id);
    if (fs.existsSync(sampleRoot)) {
      copyDir(sampleRoot, targetDir, { skipExisting: mode === "merge" });
    }
  }

  const appPath = path.join(targetDir, template.appFile);
  if (!fs.existsSync(appPath)) return;

  const sampleConfig = template.sampleConfig;
  let appContent = fs.readFileSync(appPath, "utf-8");

  if (mode === "inject") {
    appContent = template.isVanilla
      ? injectVanillaSamples(appContent, sampleChoices, sampleConfig)
      : injectReactSamples(
          appContent,
          sampleChoices,
          sampleConfig,
          template.isTypeScript,
        );
  } else {
    appContent = template.isVanilla
      ? mergeVanillaSamples(appContent, sampleChoices, sampleConfig)
      : mergeReactSamples(
          appContent,
          sampleChoices,
          sampleConfig,
          template.isTypeScript,
          template.useTds,
        );
  }

  fs.writeFileSync(appPath, appContent);
}

module.exports = { applySamples };
