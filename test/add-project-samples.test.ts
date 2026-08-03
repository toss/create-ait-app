import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { addProjectSamples, inspectSampleProject } from "../src/scaffold/add-project-samples.js";
import {
  getBundledViteSampleEntryContent,
  getViteSampleEntryHash,
} from "../src/vite/create-vite.js";

const temporaryDirectories: string[] = [];

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
  const sampleEntryHash = getViteSampleEntryHash({
    framework: "vanilla",
    isTypeScript,
    targetDirectory: directory,
  });
  writeFileSync(path.join(directory, "src", "style.css"), "");
  if (isTypeScript) {
    writeFileSync(path.join(directory, "tsconfig.json"), "{}");
  }
  writeFileSync(
    path.join(directory, "package.json"),
    JSON.stringify({
      createAitApp: {
        createViteVersion: "9.1.1",
        framework: "vanilla",
        isTypeScript,
        originalScripts: {
          build: "tsc && vite build",
          dev: "vite",
        },
        sampleEntryHash,
        sampleShellManaged: false,
        samples: [],
        source: "create-vite",
        template,
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

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

describe("addProjectSamples", () => {
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
      readFileSync(mainPath, "utf8").replace(
        "<h1>Apps in Toss</h1>",
        "<h1>사용자가 수정한 앱</h1>",
      ),
    );

    expect(addProjectSamples(directory, ["iap", "iaa"])).toMatchObject({
      addedSampleIds: ["iaa"],
      installedSampleIds: ["iap", "iaa"],
      skippedSampleIds: ["iap"],
    });

    const main = readFileSync(mainPath, "utf8");
    expect(main).toContain("mountInAppPurchasePage");
    expect(main).toContain("mountInAppAdsPage");
    expect(main).toContain("<h1>사용자가 수정한 앱</h1>");
    expect(
      readFileSync(path.join(directory, "src", "pages", "InAppPurchasePage.ts"), "utf8"),
    ).toContain("return unsubscribe");
    expect(readFileSync(path.join(directory, "src", "pages", "InAppAdsPage.ts"), "utf8")).toContain(
      "escapeHtml(rewardedState.lastReward.unitType)",
    );
    expect(inspectSampleProject(directory).installedSampleIds).toEqual(["iap", "iaa"]);
  });

  it("rejects adding samples to a project adopted from an existing Vite app", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "create-ait-existing-vite-"));
    temporaryDirectories.push(directory);
    mkdirSync(path.join(directory, "src"));
    writeFileSync(path.join(directory, "src", "main.js"), "");
    writeFileSync(
      path.join(directory, "package.json"),
      JSON.stringify({
        createAitApp: {
          createViteVersion: null,
          framework: "vanilla",
          isTypeScript: false,
          originalScripts: {
            build: "vite build",
            dev: "vite",
          },
          sampleEntryHash: null,
          sampleShellManaged: false,
          samples: [],
          source: "existing-vite",
          template: null,
        },
        devDependencies: { vite: "9.1.1" },
        scripts: {
          build: "vite build && ait build",
          dev: "vite",
        },
      }),
    );

    expect(() => addProjectSamples(directory, ["iap"])).toThrow(
      "기존 Vite 프로젝트에 추가한 앱에는 예제 코드를 자동으로 넣을 수 없어요",
    );
  });

  it("rejects projects without create-ait-app metadata", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "create-ait-unsupported-"));
    temporaryDirectories.push(directory);
    writeFileSync(path.join(directory, "package.json"), "{}");

    expect(() => addProjectSamples(directory, ["iap"])).toThrow("create-ait-app으로 만든 프로젝트");
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

    expect(inspectSampleProject(directory).isTypeScript).toBe(false);
    expect(() => addProjectSamples(directory, ["iaa"])).not.toThrow();
    expect(readFileSync(path.join(directory, "src", "main.js"), "utf8")).toContain(
      "mountInAppAdsPage",
    );
  });
});
