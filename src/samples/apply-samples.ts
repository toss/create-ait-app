import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { FrameworkKind } from "../project/framework.js";
import { copyDirectory } from "../system/copy-directory.js";
import { templatesDirectory } from "../system/paths.js";
import {
  REACT_SAMPLE_BUTTON_MARKERS,
  SAMPLE_IMPORT_MARKERS,
  SAMPLE_ROUTE_MARKERS,
  updateManagedSampleShell,
  VANILLA_SAMPLE_BUTTON_MARKERS,
} from "./managed-sample-shell.js";

export const SAMPLE_IDS = ["iap", "iaa"] as const;
export type SampleId = (typeof SAMPLE_IDS)[number];

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
      : `<button type="button" className="app-button app-button-primary" onClick={() => setPage("${id}")}>${label}</button>`;

  return {
    iap: {
      button: button("iap", "인앱 결제 테스트하기"),
      import: `import { InAppPurchasePage } from "./pages/InAppPurchasePage${extension}";`,
      route: '  if (page === "iap") return <InAppPurchasePage onBack={() => setPage(null)} />;',
    },
    iaa: {
      button: button("iaa", "인앱 광고 테스트하기"),
      import: `import { InAppAdsPage } from "./pages/InAppAdsPage${extension}";`,
      route: '  if (page === "iaa") return <InAppAdsPage onBack={() => setPage(null)} />;',
    },
  };
}

function vanillaDefinitions(isTypeScript: boolean): Record<SampleId, SampleDefinition> {
  const extension = isTypeScript ? ".ts" : ".js";
  return {
    iap: {
      button:
        '<button type="button" class="app-button app-button-primary" data-page="iap">인앱 결제 테스트하기</button>',
      import: `import { mountInAppPurchasePage } from "./pages/InAppPurchasePage${extension}";`,
      route: `  if (currentPage === "iap") {
    mountInAppPurchasePage(showHome);
    return;
  }`,
    },
    iaa: {
      button:
        '<button type="button" class="app-button app-button-primary" data-page="iaa">인앱 광고 테스트하기</button>',
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
    copyDirectory(
      path.join(templatesDirectory, "samples", assetVariant, sampleId),
      targetDirectory,
      {
        skipExisting: true,
      },
    );
  }
}

function copyViteSampleShellStyles(targetDirectory: string): void {
  copyDirectory(path.join(templatesDirectory, "samples", "vite"), targetDirectory, {
    skipExisting: true,
  });
}

function ensureViteSampleShellStyleImport(content: string): string {
  const styleImport = 'import "./create-ait-app.css";';
  if (content.includes(styleImport)) {
    return content;
  }

  const vanillaStyleImport = 'import "./style.css";';
  if (content.includes(vanillaStyleImport)) {
    return content.replace(vanillaStyleImport, `${vanillaStyleImport}\n${styleImport}`);
  }

  return content.replace(
    SAMPLE_IMPORT_MARKERS.start,
    `${styleImport}\n${SAMPLE_IMPORT_MARKERS.start}`,
  );
}

function writeReactSampleShell(
  targetDirectory: string,
  isTypeScript: boolean,
  sampleIds: SampleId[],
  preserveExistingShell: boolean,
): void {
  const definitions = reactDefinitions(isTypeScript, false);
  const appPath = path.join(targetDirectory, "src", isTypeScript ? "App.tsx" : "App.jsx");
  if (!existsSync(appPath)) {
    throw new Error("React App 파일을 찾을 수 없어 예제 코드를 추가할 수 없어요.");
  }

  const imports = sampleIds.map((id) => definitions[id].import).join("\n");
  const routes = sampleIds.map((id) => definitions[id].route).join("\n");
  const buttons = sampleIds.map((id) => `        ${definitions[id].button}`).join("\n");
  const state = isTypeScript ? "useState<string | null>(null)" : "useState(null)";

  const nextContent = `import { useState } from "react";
import "./create-ait-app.css";
${SAMPLE_IMPORT_MARKERS.start}
${imports}
${SAMPLE_IMPORT_MARKERS.end}

function App() {
  const [page, setPage] = ${state};

  ${SAMPLE_ROUTE_MARKERS.start}
${routes}
  ${SAMPLE_ROUTE_MARKERS.end}

  return (
    <main className="app">
      <header className="app-header">
        <h1 className="page-title">Apps in Toss</h1>
        <p className="page-subtitle">원하는 기능을 샌드박스 앱이나 토스 앱에서 확인해 보세요.</p>
      </header>
      <div className="app-actions">
        ${REACT_SAMPLE_BUTTON_MARKERS.start}
${buttons}
        ${REACT_SAMPLE_BUTTON_MARKERS.end}
      </div>
    </main>
  );
}

export default App;
`;

  const content = ensureViteSampleShellStyleImport(
    preserveExistingShell
      ? updateManagedSampleShell(
          readFileSync(appPath, "utf8"),
          nextContent,
          REACT_SAMPLE_BUTTON_MARKERS,
        )
      : nextContent,
  );
  writeFileSync(appPath, content);
}

function writeVanillaSampleShell(
  targetDirectory: string,
  isTypeScript: boolean,
  sampleIds: SampleId[],
  preserveExistingShell: boolean,
): void {
  const definitions = vanillaDefinitions(isTypeScript);
  const mainPath = path.join(targetDirectory, "src", isTypeScript ? "main.ts" : "main.js");
  if (!existsSync(mainPath)) {
    throw new Error("Vanilla main 파일을 찾을 수 없어 예제 코드를 추가할 수 없어요.");
  }

  const imports = sampleIds.map((id) => definitions[id].import).join("\n");
  const routes = sampleIds.map((id) => definitions[id].route).join("\n");
  const buttons = sampleIds.map((id) => `      ${definitions[id].button}`).join("\n");

  const nextContent = `${SAMPLE_IMPORT_MARKERS.start}
${imports}
${SAMPLE_IMPORT_MARKERS.end}
import "./style.css";
import "./create-ait-app.css";

let currentPage = null${isTypeScript ? " as string | null" : ""};
const app = document.querySelector${isTypeScript ? "<HTMLDivElement>" : ""}("#app");

if (!app) {
  throw new Error("#app 요소를 찾을 수 없어요.");
}

app.innerHTML = '<div id="root"></div>';

function showHome() {
  currentPage = null;
  render();
}

function render() {
  ${SAMPLE_ROUTE_MARKERS.start}
${routes}
  ${SAMPLE_ROUTE_MARKERS.end}

  const root = document.getElementById("root");
  if (!root) return;
  root.innerHTML = \`
    <main class="app">
      <header class="app-header">
        <h1 class="page-title">Apps in Toss</h1>
        <p class="page-subtitle">원하는 기능을 샌드박스 앱이나 토스 앱에서 확인해 보세요.</p>
      </header>
      <div class="app-actions">
      ${VANILLA_SAMPLE_BUTTON_MARKERS.start}
${buttons}
      ${VANILLA_SAMPLE_BUTTON_MARKERS.end}
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
`;

  const content = ensureViteSampleShellStyleImport(
    preserveExistingShell
      ? updateManagedSampleShell(
          readFileSync(mainPath, "utf8"),
          nextContent,
          VANILLA_SAMPLE_BUTTON_MARKERS,
        )
      : nextContent,
  );
  writeFileSync(mainPath, content);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// 플레이스홀더가 차지하던 줄 전체(들여쓰기 + 줄바꿈 포함)를 지워서, 마커도
// 빈 줄도 남기지 않아요.
function removePlaceholderLine(content: string, placeholder: string): string {
  const pattern = new RegExp(`^[ \\t]*${escapeRegExp(placeholder)}[ \\t]*\\r?\\n`, "m");
  return content.replace(pattern, "");
}

function renderTdsSampleShell(sampleIds: SampleId[]): string {
  const templateAppPath = path.join(
    templatesDirectory,
    "projects",
    "react-ts-tds",
    "src",
    "App.tsx",
  );
  const content = readFileSync(templateAppPath, "utf8");

  // 선택한 예제가 없으면 관리 마커 자체를 남기지 않아요 — 나중에 add-sample로
  // 예제를 추가할 때는 이 렌더링 결과와의 바이트 단위 일치로 "손대지 않은
  // 상태"를 판단해요(isUnmodifiedBundledTdsSampleEntry 참고).
  if (sampleIds.length === 0) {
    return ["{{SAMPLE_IMPORTS}}", "{{PAGE_STATE_AND_ROUTES}}", "{{SAMPLE_BUTTONS}}"].reduce(
      removePlaceholderLine,
      content,
    );
  }

  const definitions = reactDefinitions(true, true);
  const imports = sampleIds.map((id) => definitions[id].import).join("\n");
  const routes = sampleIds.map((id) => definitions[id].route).join("\n");
  const buttons = sampleIds.map((id) => `        ${definitions[id].button}`).join("\n");

  return content
    .replace(
      "{{SAMPLE_IMPORTS}}",
      `${SAMPLE_IMPORT_MARKERS.start}
${imports}
import { useState } from "react";
${SAMPLE_IMPORT_MARKERS.end}`,
    )
    .replace(
      "{{PAGE_STATE_AND_ROUTES}}",
      `${SAMPLE_ROUTE_MARKERS.start}
  const [page, setPage] = useState<string | null>(null);

${routes}
  ${SAMPLE_ROUTE_MARKERS.end}`,
    )
    .replace(
      "{{SAMPLE_BUTTONS}}",
      `${REACT_SAMPLE_BUTTON_MARKERS.start}
${buttons}
        ${REACT_SAMPLE_BUTTON_MARKERS.end}`,
    );
}

// TDS App.tsx가 create-ait-app이 스캐폴드한 그대로(예제 미선택 상태)인지
// 확인해요. Vite 쪽 isUnmodifiedBundledViteSampleEntry와 같은 패턴으로,
// 저장된 해시 없이 번들 템플릿을 그 자리에서 다시 렌더링해 바이트 단위로
// 비교해요.
export function isUnmodifiedBundledTdsSampleEntry(targetDirectory: string): boolean {
  const appPath = path.join(targetDirectory, "src", "App.tsx");
  if (!existsSync(appPath)) return false;

  return readFileSync(appPath, "utf8") === renderTdsSampleShell([]);
}

export function applyTdsSamples(
  targetDirectory: string,
  sampleIds: SampleId[],
  options: { preserveExistingShell?: boolean } = {},
): void {
  const appPath = path.join(targetDirectory, "src", "App.tsx");
  const nextContent = renderTdsSampleShell(sampleIds);
  const content = options.preserveExistingShell
    ? updateManagedSampleShell(
        readFileSync(appPath, "utf8"),
        nextContent,
        REACT_SAMPLE_BUTTON_MARKERS,
      )
    : nextContent;

  writeFileSync(appPath, content);
  for (const sampleId of sampleIds) {
    copyDirectory(
      path.join(templatesDirectory, "samples", "react-ts-tds", sampleId),
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
  preserveExistingShell = false,
}: {
  framework: FrameworkKind;
  isTypeScript: boolean;
  sampleIds: SampleId[];
  targetDirectory: string;
  preserveExistingShell?: boolean;
}): void {
  if (sampleIds.length === 0) {
    return;
  }

  if (!supportsSamples(framework)) {
    throw new Error(
      "iap/iaa 예제는 React와 Vanilla Vite 프리셋만 지원해요. 프로젝트는 모든 Vite 정적 클라이언트 프리셋으로 만들 수 있어요.",
    );
  }

  if (framework === "react") {
    const variant = isTypeScript ? "react-ts" : "react";
    copyViteSampleShellStyles(targetDirectory);
    writeReactSampleShell(targetDirectory, isTypeScript, sampleIds, preserveExistingShell);
    copySampleAssets(targetDirectory, variant, sampleIds);
    return;
  }

  const variant = isTypeScript ? "vanilla-ts" : "vanilla";
  copyViteSampleShellStyles(targetDirectory);
  writeVanillaSampleShell(targetDirectory, isTypeScript, sampleIds, preserveExistingShell);
  copySampleAssets(targetDirectory, variant, sampleIds);
}
