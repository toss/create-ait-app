function injectReactSamples(
  appContent,
  sampleChoices,
  sampleConfig,
  isTypeScript,
) {
  const hasSamples = sampleChoices.length > 0;
  const sampleImports = hasSamples
    ? sampleChoices
        .map((id) => sampleConfig[id]?.import)
        .filter(Boolean)
        .join("\n") + '\nimport { useState } from "react";'
    : "";
  const pageState = isTypeScript
    ? "useState<string | null>(null)"
    : "useState(null)";
  const pageStateAndRoutes = hasSamples
    ? `  const [page, setPage] = ${pageState};\n\n` +
      sampleChoices
        .map((id) => sampleConfig[id]?.route)
        .filter(Boolean)
        .join("\n") +
      "\n\n"
    : "";
  const sampleButtons = hasSamples
    ? sampleChoices
        .map((id) => sampleConfig[id]?.getButton())
        .filter(Boolean)
        .join("\n\n        ")
    : "";

  return appContent
    .replace("{{SAMPLE_IMPORTS}}", sampleImports)
    .replace("{{PAGE_STATE_AND_ROUTES}}", pageStateAndRoutes)
    .replace("{{SAMPLE_BUTTONS}}", sampleButtons);
}

function injectVanillaSamples(appContent, sampleChoices, sampleConfig) {
  const hasSamples = sampleChoices.length > 0;
  const sampleImports = hasSamples
    ? sampleChoices
        .map((id) => sampleConfig[id]?.import)
        .filter(Boolean)
        .join("\n")
    : "";
  const sampleRoutes = hasSamples
    ? sampleChoices
        .map((id) => sampleConfig[id]?.route)
        .filter(Boolean)
        .join("\n")
    : "";
  const sampleButtons = hasSamples
    ? sampleChoices
        .map((id) => sampleConfig[id]?.getButton())
        .filter(Boolean)
        .join("\n\n        ")
    : "";

  return appContent
    .replace("{{SAMPLE_IMPORTS}}", sampleImports)
    .replace("{{SAMPLE_ROUTES}}", sampleRoutes)
    .replace("{{SAMPLE_BUTTONS}}", sampleButtons);
}

module.exports = { injectReactSamples, injectVanillaSamples };
