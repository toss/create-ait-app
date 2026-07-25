import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { assetsDirectory, templatesDirectory } from "./paths.js";
import { copyDirectory } from "./fs-utils.js";
import type { FrameworkKind, SampleId } from "./types.js";

interface SampleDefinition {
  button: string;
  import: string;
  route: string;
}

function reactDefinitions(
  isTypeScript: boolean,
  useTds: boolean,
): Record<SampleId, SampleDefinition> {
  const extension = isTypeScript ? "" : ".jsx";
  const button = (id: SampleId, label: string): string =>
    useTds
      ? `<Button color="dark" variant="weak" onClick={() => setPage("${id}")}>${label}</Button>`
      : `<button type="button" onClick={() => setPage("${id}")}>${label}</button>`;

  return {
    iap: {
      button: button("iap", "인앱결제 테스트하기"),
      import: `import { InAppPurchasePage } from "./pages/InAppPurchasePage${extension}";`,
      route: '  if (page === "iap") return <InAppPurchasePage onBack={() => setPage(null)} />;',
    },
    iaa: {
      button: button("iaa", "인앱광고 테스트하기"),
      import: `import { InAppAdsPage } from "./pages/InAppAdsPage${extension}";`,
      route: '  if (page === "iaa") return <InAppAdsPage onBack={() => setPage(null)} />;',
    },
  };
}

function vanillaDefinitions(isTypeScript: boolean): Record<SampleId, SampleDefinition> {
  const extension = isTypeScript ? ".ts" : ".js";
  return {
    iap: {
      button: '<button type="button" data-page="iap">인앱결제 테스트하기</button>',
      import: `import { mountInAppPurchasePage } from "./pages/InAppPurchasePage${extension}";`,
      route: `  if (currentPage === "iap") {
    mountInAppPurchasePage(showHome);
    return;
  }`,
    },
    iaa: {
      button: '<button type="button" data-page="iaa">인앱광고 테스트하기</button>',
      import: `import { mountInAppAdsPage } from "./pages/InAppAdsPage${extension}";`,
      route: `  if (currentPage === "iaa") {
    mountInAppAdsPage(showHome);
    return;
  }`,
    },
  };
}

export function supportsSamples(framework: FrameworkKind, useTds = false): boolean {
  return useTds || framework === "react" || framework === "vanilla";
}

function copySampleAssets(
  targetDirectory: string,
  assetVariant: string,
  sampleIds: SampleId[],
): void {
  for (const sampleId of sampleIds) {
    copyDirectory(path.join(assetsDirectory, "samples", assetVariant, sampleId), targetDirectory, {
      skipExisting: true,
    });
  }
}

function writeReactSampleShell(
  targetDirectory: string,
  isTypeScript: boolean,
  sampleIds: SampleId[],
): void {
  const definitions = reactDefinitions(isTypeScript, false);
  const appPath = path.join(targetDirectory, "src", isTypeScript ? "App.tsx" : "App.jsx");
  if (!existsSync(appPath)) {
    throw new Error("React App 파일을 찾을 수 없어 예제 코드를 추가할 수 없습니다.");
  }

  const imports = sampleIds.map((id) => definitions[id].import).join("\n");
  const routes = sampleIds.map((id) => definitions[id].route).join("\n");
  const buttons = sampleIds.map((id) => `        ${definitions[id].button}`).join("\n");
  const state = isTypeScript ? "useState<string | null>(null)" : "useState(null)";

  writeFileSync(
    appPath,
    `import { useState } from "react";
${imports}

function App() {
  const [page, setPage] = ${state};

${routes}

  return (
    <main>
      <h1>Apps in Toss</h1>
      <p>원하는 기능을 샌드박스 앱 또는 토스 앱에서 확인하세요.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
${buttons}
      </div>
    </main>
  );
}

export default App;
`,
  );
}

function writeVanillaSampleShell(
  targetDirectory: string,
  isTypeScript: boolean,
  sampleIds: SampleId[],
): void {
  const definitions = vanillaDefinitions(isTypeScript);
  const mainPath = path.join(targetDirectory, "src", isTypeScript ? "main.ts" : "main.js");
  if (!existsSync(mainPath)) {
    throw new Error("Vanilla main 파일을 찾을 수 없어 예제 코드를 추가할 수 없습니다.");
  }

  const imports = sampleIds.map((id) => definitions[id].import).join("\n");
  const routes = sampleIds.map((id) => definitions[id].route).join("\n");
  const buttons = sampleIds.map((id) => `      ${definitions[id].button}`).join("\n");

  writeFileSync(
    mainPath,
    `${imports}
import "./style.css";

let currentPage = null${isTypeScript ? " as string | null" : ""};
const app = document.querySelector${isTypeScript ? "<HTMLDivElement>" : ""}("#app");

if (!app) {
  throw new Error("#app 요소를 찾을 수 없습니다.");
}

app.innerHTML = '<div id="root"></div>';

function showHome() {
  currentPage = null;
  render();
}

function render() {
${routes}

  const root = document.getElementById("root");
  if (!root) return;
  root.innerHTML = \`
    <main>
      <h1>Apps in Toss</h1>
      <p>원하는 기능을 샌드박스 앱 또는 토스 앱에서 확인하세요.</p>
      <div>
${buttons}
      </div>
    </main>
  \`;
  root.querySelectorAll("[data-page]").forEach((button) => {
    button.addEventListener("click", () => {
      currentPage = button.getAttribute("data-page");
      render();
    });
  });
}

render();
`,
  );
}

export function applyTdsSamples(targetDirectory: string, sampleIds: SampleId[]): void {
  const appPath = path.join(targetDirectory, "src", "App.tsx");
  const definitions = reactDefinitions(true, true);
  let content = readFileSync(appPath, "utf8");

  content = content
    .replace(
      "{{SAMPLE_IMPORTS}}",
      sampleIds.length > 0
        ? `${sampleIds.map((id) => definitions[id].import).join("\n")}\nimport { useState } from "react";`
        : "",
    )
    .replace(
      "{{PAGE_STATE_AND_ROUTES}}",
      sampleIds.length > 0
        ? `const [page, setPage] = useState<string | null>(null);\n\n${sampleIds
            .map((id) => definitions[id].route.trimStart())
            .join("\n  ")}`
        : "",
    )
    .replace(
      "{{SAMPLE_BUTTONS}}",
      sampleIds.map((id) => definitions[id].button).join("\n        "),
    );

  writeFileSync(appPath, content);
  for (const sampleId of sampleIds) {
    copyDirectory(
      path.join(templatesDirectory, "react-ts-tds", "samples", sampleId),
      targetDirectory,
      { skipExisting: true },
    );
  }
}

export function applyViteSamples({
  framework,
  isTypeScript,
  sampleIds,
  targetDirectory,
}: {
  framework: FrameworkKind;
  isTypeScript: boolean;
  sampleIds: SampleId[];
  targetDirectory: string;
}): void {
  if (sampleIds.length === 0) {
    return;
  }

  if (!supportsSamples(framework)) {
    throw new Error(
      "현재 iap/iaa 예제는 React와 Vanilla Vite 프리셋만 지원합니다. 프로젝트 생성 자체는 모든 Vite CSR 프리셋을 지원합니다.",
    );
  }

  if (framework === "react") {
    const variant = isTypeScript ? "react-ts" : "react";
    copySampleAssets(targetDirectory, variant, sampleIds);
    writeReactSampleShell(targetDirectory, isTypeScript, sampleIds);
    return;
  }

  const variant = isTypeScript ? "vanilla-ts" : "vanilla";
  copySampleAssets(targetDirectory, variant, sampleIds);
  writeVanillaSampleShell(targetDirectory, isTypeScript, sampleIds);
}
