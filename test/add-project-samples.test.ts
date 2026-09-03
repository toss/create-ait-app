import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { addProjectSamples, inspectSampleProject } from "../src/scaffold/add-project-samples.js";
import { applyProjectSamples } from "../src/scaffold/apply-project-samples.js";
import { createBaseProject } from "../src/scaffold/create-base-project.js";
import { initializeAitProject } from "../src/scaffold/initialize-ait-project.js";
import { APPS_IN_TOSS_WEB_FRAMEWORK_PACKAGE_NAME } from "../src/apps-in-toss/version-policy.js";
import { getBundledViteSampleEntryContent } from "../src/vite/create-vite.js";
import { applyViteStarterPage } from "../src/vite/starter-page.js";

const temporaryDirectories: string[] = [];

function createTdsProject(): string {
  const directory = mkdtempSync(path.join(tmpdir(), "create-ait-add-sample-tds-"));
  temporaryDirectories.push(directory);
  const baseProject = createBaseProject({
    packageName: "tds-app",
    targetDirectory: directory,
    useTds: true,
  });
  initializeAitProject({
    packageManager: "npm",
    packageName: "tds-app",
    targetDirectory: directory,
  });
  applyProjectSamples({
    baseProject,
    sampleIds: [],
    targetDirectory: directory,
    useTds: true,
  });
  return directory;
}

function createVanillaProject(isTypeScript = true): string {
  const directory = mkdtempSync(path.join(tmpdir(), "create-ait-add-sample-"));
  temporaryDirectories.push(directory);
  mkdirSync(path.join(directory, "src"));
  const template = isTypeScript ? "vanilla-ts" : "vanilla";
  const mainFile = isTypeScript ? "main.ts" : "main.js";
  const initialMain = getBundledViteSampleEntryContent({
    framework: "vanilla",
    isTypeScript,
    template,
  });
  if (initialMain === null) {
    throw new Error(`create-vite ${template} fixture를 찾을 수 없어요.`);
  }
  writeFileSync(path.join(directory, "src", mainFile), initialMain);
  writeFileSync(path.join(directory, "src", "style.css"), "");
  if (isTypeScript) {
    writeFileSync(path.join(directory, "tsconfig.json"), "{}");
  }
  writeFileSync(
    path.join(directory, "package.json"),
    JSON.stringify({
      dependencies: {
        [APPS_IN_TOSS_WEB_FRAMEWORK_PACKAGE_NAME]: "1.0.0",
      },
      devDependencies: {
        vite: "9.1.1",
      },
      scripts: {
        build: "ait build",
        dev: "granite dev",
      },
    }),
  );
  return directory;
}

function createReactProject(): string {
  const directory = mkdtempSync(path.join(tmpdir(), "create-ait-add-react-sample-"));
  temporaryDirectories.push(directory);
  mkdirSync(path.join(directory, "src"));
  const initialApp = getBundledViteSampleEntryContent({
    framework: "react",
    isTypeScript: true,
    template: "react-ts",
  });
  if (initialApp === null) {
    throw new Error("create-vite react-ts fixture를 찾을 수 없어요.");
  }
  writeFileSync(path.join(directory, "src", "App.tsx"), initialApp);
  writeFileSync(path.join(directory, "src", "App.css"), ".custom-style { color: tomato; }\n");
  writeFileSync(
    path.join(directory, "package.json"),
    JSON.stringify({
      dependencies: {
        [APPS_IN_TOSS_WEB_FRAMEWORK_PACKAGE_NAME]: "1.0.0",
        react: "19.0.0",
      },
      devDependencies: {
        vite: "9.2.0",
      },
    }),
  );
  return directory;
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

describe("addProjectSamples", () => {
  it("lets the example shell take priority over an untouched Apps in Toss starter", () => {
    const directory = createVanillaProject();
    applyViteStarterPage(directory, "vanilla-ts");

    expect(readFileSync(path.join(directory, "src", "main.ts"), "utf8")).toContain("반가워요");

    addProjectSamples(directory, ["iap"]);

    const main = readFileSync(path.join(directory, "src", "main.ts"), "utf8");
    expect(main).toContain("InAppPurchasePage");
    expect(main).toContain("create-ait-app:sample-imports:start");
    expect(main).not.toContain("반가워요");
  });

  it("restores the shared sample page styles without overwriting React project CSS", () => {
    const directory = createReactProject();

    addProjectSamples(directory, ["iaa"]);

    const app = readFileSync(path.join(directory, "src", "App.tsx"), "utf8");
    expect(app).toContain('import "./create-ait-app.css"');
    expect(app).toContain('className="app-header"');
    expect(app).toContain('className="app-button app-button-primary"');
    expect(readFileSync(path.join(directory, "src", "create-ait-app.css"), "utf8")).toContain(
      ".page-title",
    );
    expect(readFileSync(path.join(directory, "src", "App.css"), "utf8")).toBe(
      ".custom-style { color: tomato; }\n",
    );
  });

  it("adds new samples while preserving previously installed samples", () => {
    const directory = createVanillaProject();

    expect(addProjectSamples(directory, ["iap"])).toMatchObject({
      addedSampleIds: ["iap"],
      installedSampleIds: ["iap"],
      skippedSampleIds: [],
    });
    expect(existsSync(path.join(directory, "src", "pages", "InAppPurchasePage.ts"))).toBe(true);

    const mainPath = path.join(directory, "src", "main.ts");
    writeFileSync(
      mainPath,
      readFileSync(mainPath, "utf8")
        .replace('import "./create-ait-app.css";\n', "")
        .replace(
          '<h1 class="page-title">Apps in Toss</h1>',
          '<h1 class="page-title">사용자가 수정한 앱</h1>',
        ),
    );
    rmSync(path.join(directory, "src", "create-ait-app.css"));

    expect(addProjectSamples(directory, ["iap", "iaa"])).toMatchObject({
      addedSampleIds: ["iaa"],
      installedSampleIds: ["iap", "iaa"],
      skippedSampleIds: ["iap"],
    });

    const main = readFileSync(mainPath, "utf8");
    expect(main).toContain("mountInAppPurchasePage");
    expect(main).toContain("mountInAppAdsPage");
    expect(main).toContain('import "./create-ait-app.css"');
    expect(main).toContain('<h1 class="page-title">사용자가 수정한 앱</h1>');
    expect(readFileSync(path.join(directory, "src", "create-ait-app.css"), "utf8")).toContain(
      ".app-header",
    );
    expect(
      readFileSync(path.join(directory, "src", "pages", "InAppPurchasePage.ts"), "utf8"),
    ).toContain("return unsubscribe");
    expect(readFileSync(path.join(directory, "src", "pages", "InAppAdsPage.ts"), "utf8")).toContain(
      "escapeHtml(rewardedState.lastReward.unitType)",
    );
    expect(inspectSampleProject(directory).installedSampleIds).toEqual(["iap", "iaa"]);
    expect(
      JSON.parse(readFileSync(path.join(directory, "package.json"), "utf8")).createAitApp,
    ).toBeUndefined();
  });

  it("rejects projects that are not Apps in Toss projects", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "create-ait-unsupported-"));
    temporaryDirectories.push(directory);
    writeFileSync(path.join(directory, "package.json"), "{}");

    expect(() => addProjectSamples(directory, ["iap"])).toThrow("Apps in Toss 프로젝트");
  });

  it("removes the legacy createAitApp metadata written by older CLI versions", () => {
    const directory = createVanillaProject();
    const packageJsonPath = path.join(directory, "package.json");
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
    packageJson.createAitApp = {
      framework: "vanilla",
      sampleShellManaged: false,
      samples: [],
      source: "create-vite",
    };
    writeFileSync(packageJsonPath, JSON.stringify(packageJson));

    addProjectSamples(directory, ["iap"]);

    expect(JSON.parse(readFileSync(packageJsonPath, "utf8")).createAitApp).toBeUndefined();
  });

  it("rejects a TDS project whose App file has no managed sample markers", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "create-ait-tds-unmanaged-"));
    temporaryDirectories.push(directory);
    mkdirSync(path.join(directory, "src"));
    writeFileSync(
      path.join(directory, "src", "App.tsx"),
      "export default function App() {\n  return <div>직접 만든 앱</div>;\n}\n",
    );
    writeFileSync(
      path.join(directory, "package.json"),
      JSON.stringify({
        dependencies: {
          [APPS_IN_TOSS_WEB_FRAMEWORK_PACKAGE_NAME]: "1.0.0",
          "@toss/tds-mobile-ait": "1.0.0",
          react: "18.0.0",
        },
      }),
    );

    expect(() => addProjectSamples(directory, ["iap"])).toThrow(
      "초기 상태에서 수정되어 있거나 예제 코드 관리 구간이 없어",
    );
  });

  it("adds the first sample to a marker-less TDS project scaffolded without samples (I2)", () => {
    const directory = createTdsProject();

    expect(addProjectSamples(directory, ["iap"])).toMatchObject({
      addedSampleIds: ["iap"],
      installedSampleIds: ["iap"],
      skippedSampleIds: [],
    });
    expect(existsSync(path.join(directory, "src", "pages", "InAppPurchasePage.tsx"))).toBe(true);
    expect(readFileSync(path.join(directory, "src", "App.tsx"), "utf8")).toContain(
      "create-ait-app:sample-imports:start",
    );
  });

  it("rejects a marker-less TDS project whose App.tsx was edited before the first add-sample (I2)", () => {
    const directory = createTdsProject();
    const appPath = path.join(directory, "src", "App.tsx");
    writeFileSync(appPath, readFileSync(appPath, "utf8").replace("반가워요", "사용자가 수정한 앱"));

    expect(() => addProjectSamples(directory, ["iap"])).toThrow(
      "초기 상태에서 수정되어 있거나 예제 코드 관리 구간이 없어",
    );
    expect(readFileSync(appPath, "utf8")).toContain("사용자가 수정한 앱");
  });

  it("refuses to overwrite a sample shell when its management markers are missing", () => {
    const directory = createVanillaProject();
    addProjectSamples(directory, ["iap"]);

    const mainPath = path.join(directory, "src", "main.ts");
    const customizedMain = readFileSync(mainPath, "utf8").replace(
      "// create-ait-app:sample-routes:start",
      "// 사용자가 관리 구간을 제거함",
    );
    writeFileSync(mainPath, customizedMain);

    expect(() => addProjectSamples(directory, ["iaa"])).toThrow(
      "App/main 파일을 안전하게 수정할 수 없어요",
    );
    expect(readFileSync(mainPath, "utf8")).toBe(customizedMain);
    expect(inspectSampleProject(directory).installedSampleIds).toEqual(["iap"]);
  });

  it("refuses to replace a customized Vite entry when adding the first sample", () => {
    const directory = createVanillaProject();
    const mainPath = path.join(directory, "src", "main.ts");
    const customizedMain = `${readFileSync(mainPath, "utf8")}\nconsole.log("customized");\n`;
    writeFileSync(mainPath, customizedMain);

    expect(() => addProjectSamples(directory, ["iap"])).toThrow("Vite 초기 상태에서 수정되어");
    expect(readFileSync(mainPath, "utf8")).toBe(customizedMain);
    expect(inspectSampleProject(directory).installedSampleIds).toEqual([]);
  });

  it("keeps the original JavaScript project type after TypeScript files are added", () => {
    const directory = createVanillaProject(false);
    addProjectSamples(directory, ["iap"]);
    writeFileSync(path.join(directory, "src", "helper.ts"), "export const helper = true;\n");
    // 마커 없는 main.ts가 생겨도 관리 마커가 있는 main.js를 엔트리로 유지한다.
    writeFileSync(path.join(directory, "src", "main.ts"), "export {};\n");

    expect(inspectSampleProject(directory).isTypeScript).toBe(false);
    expect(() => addProjectSamples(directory, ["iaa"])).not.toThrow();
    expect(readFileSync(path.join(directory, "src", "main.js"), "utf8")).toContain(
      "mountInAppAdsPage",
    );
  });
});
