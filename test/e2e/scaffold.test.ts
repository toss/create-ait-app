import { spawn, type ChildProcess } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { chromium, type Browser, type Page } from "playwright";
import {
  APPS_IN_TOSS_WEB_FRAMEWORK_PACKAGE_NAME,
  APPS_IN_TOSS_WEB_FRAMEWORK_RELEASE_CHANNEL,
  APPS_IN_TOSS_WEB_FRAMEWORK_VERSION,
  isPrereleaseWebFrameworkChannel,
} from "../../src/apps-in-toss/version-policy.js";
import { getSupportedViteTemplates } from "../../src/vite/create-vite.js";
import { getViteStarterTemplateDefinition } from "../../src/vite/starter-page.js";

const enabled = process.env.AIT_RUN_E2E === "1";
const requested = process.env.AIT_E2E_TEMPLATES ?? "react-ts";
const requestedSamples = process.env.AIT_E2E_SAMPLES;
const templates =
  requested === "all"
    ? [...getSupportedViteTemplates(), "tds"]
    : requested.split(",").filter(Boolean);
const running = new Set<ChildProcess>();
const staticServers = new Set<Server>();
const temporaryDirectories = new Set<string>();
let browser: Browser | null = null;

function findAitArtifacts(projectDirectory: string): string[] {
  const artifacts: string[] = [];
  const directories = [projectDirectory];

  while (directories.length > 0) {
    const directory = directories.pop();
    if (!directory) continue;

    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (entry.name !== "node_modules" && entry.name !== ".git") {
          directories.push(path.join(directory, entry.name));
        }
        continue;
      }
      if (entry.isFile() && entry.name.endsWith(".ait")) {
        artifacts.push(path.relative(projectDirectory, path.join(directory, entry.name)));
      }
    }
  }

  return artifacts.sort();
}

function generatedProjectEnvironment(
  nodeEnvironment?: "development" | "production",
): NodeJS.ProcessEnv {
  const environment: NodeJS.ProcessEnv = { ...process.env, CI: "1" };
  for (const key of Object.keys(environment)) {
    if (
      key === "NODE_ENV" ||
      key === "NODE_OPTIONS" ||
      key === "npm_config_user_agent" ||
      key === "npm_execpath" ||
      key.startsWith("YARN_")
    ) {
      delete environment[key];
    }
  }
  if (nodeEnvironment) {
    environment.NODE_ENV = nodeEnvironment;
  }
  return environment;
}

async function run(
  command: string,
  args: string[],
  cwd: string,
  environment: NodeJS.ProcessEnv = { ...process.env, CI: "1" },
): Promise<string> {
  const commandLabel = `${command} ${args.join(" ")}`;
  const startedAt = Date.now();
  process.stdout.write(`[e2e] 시작: ${commandLabel}\n`);

  const processHandle = spawn(command, args, {
    cwd,
    detached: process.platform !== "win32",
    env: environment,
    stdio: ["ignore", "pipe", "pipe"],
  });
  running.add(processHandle);

  let stdout = "";
  let stderr = "";
  processHandle.stdout?.on("data", (chunk: Buffer | string) => {
    stdout += String(chunk);
  });
  processHandle.stderr?.on("data", (chunk: Buffer | string) => {
    stderr += String(chunk);
  });

  return new Promise<string>((resolve, reject) => {
    let settled = false;
    const progressTimer = setInterval(() => {
      process.stdout.write(`[e2e] 실행 중 (${Date.now() - startedAt}ms): ${commandLabel}\n`);
    }, 30_000);
    progressTimer.unref();
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      clearInterval(progressTimer);
      running.delete(processHandle);
      callback();
    };

    processHandle.once("error", (error) => finish(() => reject(error)));
    processHandle.once("close", (code, signal) => {
      finish(() => {
        process.stdout.write(`[e2e] 종료 (${Date.now() - startedAt}ms): ${commandLabel}\n`);
        if (code !== 0) {
          if (stdout) process.stderr.write(stdout);
          if (stderr) process.stderr.write(stderr);
          reject(
            new Error(
              `${commandLabel} failed with code ${String(code)} and signal ${String(signal)}`,
            ),
          );
          return;
        }
        resolve(stdout);
      });
    });
  });
}

beforeAll(async () => {
  if (enabled) {
    browser = await chromium.launch();
  }
}, 120_000);

afterAll(async () => {
  await browser?.close();
  browser = null;
});

async function stopProcessTree(processHandle: ChildProcess): Promise<void> {
  if (processHandle.exitCode !== null || processHandle.signalCode !== null) return;

  await new Promise<void>((resolve) => {
    const finish = () => {
      clearTimeout(forceTimer);
      clearTimeout(giveUpTimer);
      resolve();
    };
    const kill = (signal: NodeJS.Signals) => {
      try {
        if (process.platform !== "win32" && processHandle.pid) {
          process.kill(-processHandle.pid, signal);
        } else {
          processHandle.kill(signal);
        }
      } catch {
        finish();
      }
    };
    const forceTimer = setTimeout(() => kill("SIGKILL"), 5_000);
    const giveUpTimer = setTimeout(finish, 10_000);

    processHandle.once("error", finish);
    processHandle.once("exit", finish);
    kill("SIGTERM");
  });
}

async function serveBuild(directory: string): Promise<string> {
  const contentTypes: Record<string, string> = {
    ".css": "text/css",
    ".html": "text/html",
    ".js": "text/javascript",
    ".png": "image/png",
    ".svg": "image/svg+xml",
  };
  const server = createServer((request, response) => {
    const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
    const relativePath = pathname === "/" ? "index.html" : pathname.slice(1);
    const filePath = path.resolve(directory, relativePath);
    if (!filePath.startsWith(`${path.resolve(directory)}${path.sep}`)) {
      response.writeHead(403).end();
      return;
    }
    try {
      response.setHeader("Content-Type", contentTypes[path.extname(filePath)] ?? "text/plain");
      response.end(readFileSync(filePath));
    } catch {
      response.writeHead(404).end();
    }
  });
  staticServers.add(server);
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address() as AddressInfo;
  return `http://127.0.0.1:${address.port}`;
}

// Vanilla JS로 만든 첫 페이지가 기준 계약이에요. 모든 create-vite 프리셋의
// dist/index.html은 프레임워크별 렌더링 구현이 달라도 이 테스트를 그대로
// 통과해야 해요.
async function assertMatchesVanillaStarterPage(page: Page): Promise<void> {
  await expect.poll(() => page.getByRole("heading", { name: "반가워요" }).count()).toBe(1);
  await expect.poll(() => page.getByText("앱인토스 개발을 시작해 보세요.").count()).toBe(1);
  await expect
    .poll(() => page.getByRole("link", { name: "개발자센터" }).getAttribute("href"))
    .toBe("https://developers-apps-in-toss.toss.im");
  await expect
    .poll(() => page.getByRole("link", { name: "개발자 커뮤니티" }).getAttribute("href"))
    .toBe("https://techchat-apps-in-toss.toss.im");
  await expect
    .poll(() =>
      page
        .getByRole("img", { name: "Apps in Toss" })
        .evaluate((image: HTMLImageElement) => (image.complete ? image.naturalWidth : 0)),
    )
    .toBeGreaterThan(0);

  const layout = await page.locator('[data-testid="apps-in-toss-starter"]').evaluate((starter) => {
    const pageRoot = starter.parentElement;
    const header = starter.querySelector<HTMLElement>(".app-header");
    const heading = starter.querySelector<HTMLElement>(".page-title");
    const actions = starter.querySelector<HTMLElement>(".app-actions");
    const button = starter.querySelector<HTMLElement>(".app-button");
    const logoWrap = starter.querySelector<HTMLElement>(".app-logo-wrap");
    const logo = starter.querySelector<HTMLImageElement>(".logo");
    if (!pageRoot || !header || !heading || !actions || !button || !logoWrap || !logo) {
      throw new Error("Vanilla JS 기준 화면의 레이아웃 요소가 없어요.");
    }
    const rootStyle = getComputedStyle(pageRoot);
    const headerStyle = getComputedStyle(header);
    const headingStyle = getComputedStyle(heading);
    const actionsStyle = getComputedStyle(actions);
    const buttonBox = button.getBoundingClientRect();
    const buttonStyle = getComputedStyle(button);
    const logoWrapStyle = getComputedStyle(logoWrap);
    const logoBox = logo.getBoundingClientRect();
    return {
      actionsGap: actionsStyle.gap,
      actionsPaddingBottom: actionsStyle.paddingBottom,
      actionsPaddingTop: actionsStyle.paddingTop,
      buttonBackground: buttonStyle.backgroundColor,
      buttonRadius: buttonStyle.borderRadius,
      buttonWidth: buttonBox.width,
      headerGap: headerStyle.gap,
      headerPaddingBottom: headerStyle.paddingBottom,
      headerPaddingTop: headerStyle.paddingTop,
      headingFontSize: headingStyle.fontSize,
      headingFontWeight: headingStyle.fontWeight,
      logoBottom: logoWrapStyle.bottom,
      logoWidth: logoBox.width,
      rootPadding: rootStyle.padding,
    };
  });

  expect(layout.rootPadding).toBe("24px");
  expect(layout.headerGap).toBe("12px");
  expect(layout.headerPaddingTop).toBe("24px");
  expect(layout.headerPaddingBottom).toBe("24px");
  expect(layout.headingFontSize).toBe("24px");
  expect(layout.headingFontWeight).toBe("600");
  expect(layout.actionsGap).toBe("16px");
  expect(layout.actionsPaddingTop).toBe("24px");
  expect(layout.actionsPaddingBottom).toBe("24px");
  expect(layout.buttonBackground).toBe("rgb(235, 242, 255)");
  expect(layout.buttonRadius).toBe("16px");
  expect(layout.buttonWidth).toBeCloseTo(342, 0);
  expect(layout.logoBottom).toBe("24px");
  expect(layout.logoWidth).toBeCloseTo(160, 0);
}

afterEach(async () => {
  for (const processHandle of running) {
    await stopProcessTree(processHandle);
  }
  running.clear();
  for (const server of staticServers) {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
  staticServers.clear();
  for (const directory of temporaryDirectories) {
    rmSync(directory, { force: true, recursive: true });
  }
  temporaryDirectories.clear();
}, 120_000);

describe.skipIf(!enabled)("scaffolding compatibility", () => {
  it.each(templates)(
    "%s: scaffold, build, and verify dist/index.html",
    async (template) => {
      const parent = mkdtempSync(path.join(tmpdir(), `create-ait-scaffolding-${template}-`));
      temporaryDirectories.add(parent);
      const projectDirectory = path.join(parent, "scaffolded-app");
      const sampleIds = requestedSamples?.split(",").filter(Boolean) ?? [];
      const cliArguments = [
        "yarn",
        "exec",
        "create-ait-app",
        projectDirectory,
        "--inline",
        "--pm",
        "npm",
      ];
      if (template === "tds") {
        cliArguments.push("--tds");
      } else {
        cliArguments.push("--template", template);
      }
      if (sampleIds[0]) {
        cliArguments.push("--sample", sampleIds[0]);
      }

      const scaffoldOutput = await run("corepack", cliArguments, process.cwd());
      if (template !== "tds") {
        // --inline은 create-vite를 quiet로 스폰해야 해요 — create-vite 자체의
        // "Done. Now run:" 안내가 새어나오면 안 되고, 우리 CLI의 완료 배너만
        // 보여야 해요(toss/create-ait-app 이슈: create-vite passthrough 위생).
        expect(scaffoldOutput).not.toContain("Done. Now run:");
        expect(scaffoldOutput).toContain("프로젝트를 만들었어요");
      }
      if (sampleIds.length > 1) {
        await run(
          "corepack",
          [
            "yarn",
            "exec",
            "create-ait-app",
            "add-sample",
            projectDirectory,
            "--inline",
            "--sample",
            sampleIds.slice(1).join(","),
          ],
          process.cwd(),
        );
      }
      const packageJson = JSON.parse(
        readFileSync(path.join(projectDirectory, "package.json"), "utf8"),
      );
      expect(packageJson.dependencies[APPS_IN_TOSS_WEB_FRAMEWORK_PACKAGE_NAME]).toBe(
        APPS_IN_TOSS_WEB_FRAMEWORK_VERSION,
      );
      const installedWebFrameworkPackageJson = JSON.parse(
        readFileSync(
          path.join(
            projectDirectory,
            "node_modules",
            ...APPS_IN_TOSS_WEB_FRAMEWORK_PACKAGE_NAME.split("/"),
            "package.json",
          ),
          "utf8",
        ),
      );
      if (isPrereleaseWebFrameworkChannel(APPS_IN_TOSS_WEB_FRAMEWORK_RELEASE_CHANNEL)) {
        // beta/rc 채널은 dist-tag가 가리키는 최신 프리릴리즈 버전이 설치돼요.
        expect(installedWebFrameworkPackageJson.version).toMatch(/^\d+\.\d+\.\d+-/);
      } else {
        expect(installedWebFrameworkPackageJson.version).toBe(APPS_IN_TOSS_WEB_FRAMEWORK_VERSION);
      }
      expect(packageJson.createAitApp).toBeUndefined();
      if (sampleIds.length > 0) {
        const pageFiles = readdirSync(path.join(projectDirectory, "src", "pages"));
        for (const sampleId of sampleIds) {
          const pageName = sampleId === "iap" ? "InAppPurchasePage" : "InAppAdsPage";
          expect(
            pageFiles.some((fileName) => fileName.startsWith(`${pageName}.`)),
            `${pageName} 예제 페이지가 없어요.`,
          ).toBe(true);
        }
      }
      if (template !== "tds") {
        const starter = getViteStarterTemplateDefinition(template);
        const entry = readFileSync(path.join(projectDirectory, starter.entryPath), "utf8");
        if (sampleIds.length === 0) {
          expect(entry).toContain('data-testid="apps-in-toss-starter"');
          expect(entry).toContain("반가워요");
        } else {
          expect(entry).toContain("create-ait-app:sample-imports:start");
          expect(entry).not.toContain('data-testid="apps-in-toss-starter"');
        }
        for (const stylePath of [
          starter.stylePath,
          starter.globalStylePath,
          starter.pageStylePath,
        ].filter((value): value is string => Boolean(value))) {
          expect(existsSync(path.join(projectDirectory, stylePath))).toBe(true);
        }
      }
      expect(readFileSync(path.join(projectDirectory, "index.html"), "utf8")).toContain(
        '<html lang="ko">',
      );
      expect(readFileSync(path.join(projectDirectory, ".gitignore"), "utf8")).toContain(
        "node_modules",
      );
      const aitArtifactsBeforeBuild = new Set(findAitArtifacts(projectDirectory));
      const buildEnvironment =
        template === "tds"
          ? generatedProjectEnvironment()
          : generatedProjectEnvironment("production");
      await run("npm", ["run", "build"], projectDirectory, buildEnvironment);
      expect(existsSync(path.join(projectDirectory, "dist", "index.html"))).toBe(true);
      const newAitArtifacts = findAitArtifacts(projectDirectory).filter(
        (artifact) => !aitArtifactsBeforeBuild.has(artifact),
      );
      expect(newAitArtifacts, "ait build가 새로운 .ait 파일을 만들지 않았어요.").not.toHaveLength(
        0,
      );

      if (template !== "tds") {
        const buildUrl = await serveBuild(path.join(projectDirectory, "dist"));
        const previewUrl = `${buildUrl}/index.html`;

        if (!browser) throw new Error("Playwright Chromium이 준비되지 않았어요.");
        const page = await browser.newPage({
          colorScheme: "light",
          deviceScaleFactor: 1,
          viewport: { height: 844, width: 390 },
        });
        const browserErrors: string[] = [];
        page.on("console", (message) => {
          if (message.type() === "error") browserErrors.push(message.text());
        });
        page.on("pageerror", (error) => browserErrors.push(error.message));
        const response = await page.goto(previewUrl, { waitUntil: "networkidle" });
        expect(response?.ok()).toBe(true);
        expect(await page.title()).toBe("Apps in Toss");
        await expect.poll(() => page.locator(".ait-panel-root").count()).toBe(0);

        if (sampleIds.length === 0) {
          await assertMatchesVanillaStarterPage(page);

          const screenshotDirectory = process.env.AIT_E2E_SCREENSHOT_DIR;
          if (screenshotDirectory) {
            mkdirSync(screenshotDirectory, { recursive: true });
            await page.screenshot({
              path: path.join(screenshotDirectory, `${template}.png`),
            });
          }
        } else {
          for (const sampleId of sampleIds) {
            const label = sampleId === "iap" ? "인앱 결제 테스트하기" : "인앱 광고 테스트하기";
            await expect.poll(() => page.getByRole("button", { name: label }).count()).toBe(1);
          }
        }
        expect(browserErrors).toEqual([]);
        await page.close();
      }
    },
    600_000,
  );
});
