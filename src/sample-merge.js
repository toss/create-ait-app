function addImport(content, importLine) {
  if (content.includes(importLine)) return content;

  const lines = content.split("\n");
  let lastImportIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("import ")) lastImportIndex = i;
  }

  if (lastImportIndex === -1) {
    return `${importLine}\n${content}`;
  }

  lines.splice(lastImportIndex + 1, 0, importLine);
  return lines.join("\n");
}

function ensureReactPageState(content, isTypeScript) {
  if (content.includes("const [page, setPage]")) return content;

  const stateLine = `  const [page, setPage] = ${
    isTypeScript ? "useState<string | null>(null)" : "useState(null)"
  };\n\n`;

  let next = addImport(content, 'import { useState } from "react";');
  return next.replace(/function App\(\) \{\n/, `function App() {\n${stateLine}`);
}

function insertBeforeAppReturn(content, block) {
  const appStart = content.indexOf("function App() {");
  if (appStart === -1) {
    throw new Error("App 컴포넌트를 찾을 수 없어요.");
  }

  const body = content.slice(appStart);
  const returnMatch = body.match(/\n  return \(/);
  if (!returnMatch) {
    throw new Error("App 컴포넌트의 return 문을 찾을 수 없어요.");
  }

  const insertAt = appStart + returnMatch.index;
  return `${content.slice(0, insertAt)}\n${block}${content.slice(insertAt)}`;
}

function insertReactSampleButton(content, button, useTds) {
  if (content.includes(button)) return content;

  if (useTds) {
    return content.replace(
      /(\n      <\/div>\n\n      <div\n        style=\{\{\n          position: "fixed")/,
      `\n        ${button}$1`,
    );
  }

  return content.replace(
    /(\n      <\/div>\n\n      <div className="app-logo-wrap">)/,
    `\n        ${button}$1`,
  );
}

function mergeReactSamples(
  appContent,
  sampleChoices,
  sampleConfig,
  isTypeScript,
  useTds,
) {
  let content = ensureReactPageState(appContent, isTypeScript);

  for (const id of sampleChoices) {
    const config = sampleConfig[id];
    if (!config) continue;

    content = addImport(content, config.import);

    if (!content.includes(`page === "${id}"`)) {
      content = insertBeforeAppReturn(content, config.route);
    }

    content = insertReactSampleButton(content, config.getButton(), useTds);
  }

  return content;
}

function insertVanillaRoute(content, route) {
  const routeKey = route.match(/currentPage === "([^"]+)"/)?.[1];
  if (routeKey && content.includes(`currentPage === "${routeKey}"`)) {
    return content;
  }

  return content.replace(
    /(function render\(\) \{\n)([\s\S]*?)(  renderHome\(\);)/,
    `$1$2${route}\n$3`,
  );
}

function insertVanillaSampleButton(content, button) {
  if (content.includes(button)) return content;

  return content.replace(
    /(\n      <\/div>\n\n      <div class="app-logo-wrap">)/,
    `\n        ${button}$1`,
  );
}

function mergeVanillaSamples(appContent, sampleChoices, sampleConfig) {
  let content = appContent;

  for (const id of sampleChoices) {
    const config = sampleConfig[id];
    if (!config) continue;

    content = addImport(content, config.import);
    content = insertVanillaRoute(content, config.route);
    content = insertVanillaSampleButton(content, config.getButton());
  }

  return content;
}

module.exports = { mergeReactSamples, mergeVanillaSamples };
