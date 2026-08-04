import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  APPS_IN_TOSS_WEB_FRAMEWORK_PACKAGE_NAME,
  APPS_IN_TOSS_WEB_FRAMEWORK_RELEASE_CHANNEL,
  APPS_IN_TOSS_WEB_FRAMEWORK_VERSION,
  isPrereleaseWebFrameworkChannel,
} from "../../src/apps-in-toss/version-policy.js";
import { getSupportedViteTemplates } from "../../src/vite/create-vite.js";

const enabled = process.env.AIT_RUN_E2E === "1";
const requested = process.env.AIT_E2E_TEMPLATES ?? "react-ts";
const requestedSamples = process.env.AIT_E2E_SAMPLES;
const templates =
  requested === "all"
    ? [...getSupportedViteTemplates(), "tds"]
    : requested.split(",").filter(Boolean);
const running = new Set<ChildProcess>();
const temporaryDirectories = new Set<string>();

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

function generatedProjectEnvironment(): NodeJS.ProcessEnv {
  const environment: NodeJS.ProcessEnv = { ...process.env, CI: "1" };
  for (const key of Object.keys(environment)) {
    if (
      key === "NODE_OPTIONS" ||
      key === "npm_config_user_agent" ||
      key === "npm_execpath" ||
      key.startsWith("YARN_")
    ) {
      delete environment[key];
    }
  }
  return environment;
}

function run(
  command: string,
  args: string[],
  cwd: string,
  environment: NodeJS.ProcessEnv = { ...process.env, CI: "1" },
): void {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    env: environment,
  });
  if (result.status !== 0) {
    throw new Error(
      [result.stdout, result.stderr, `${command} ${args.join(" ")} failed`]
        .filter(Boolean)
        .join("\n"),
    );
  }
}

async function waitForDevServer(processHandle: ChildProcess, timeoutMs = 60_000): Promise<void> {
  let output = "";
  processHandle.stdout?.on("data", (chunk: Buffer | string) => {
    output += String(chunk);
  });
  processHandle.stderr?.on("data", (chunk: Buffer | string) => {
    output += String(chunk);
  });

  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (processHandle.exitCode !== null) {
      throw new Error(`dev server exited with ${String(processHandle.exitCode)}\n${output}`);
    }
    try {
      const response = await fetch("http://localhost:5173");
      if (response.ok) return;
    } catch {
      // Server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`dev server did not become ready within 60 seconds\n${output}`);
}

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

afterEach(async () => {
  for (const processHandle of running) {
    await stopProcessTree(processHandle);
  }
  running.clear();
  for (const directory of temporaryDirectories) {
    rmSync(directory, { force: true, recursive: true });
  }
  temporaryDirectories.clear();
}, 120_000);

describe.skipIf(!enabled)("scaffolding compatibility", () => {
  it.each(templates)(
    "%s: scaffold, build Vite and Apps in Toss, and start dev server",
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

      run("corepack", cliArguments, process.cwd());
      if (sampleIds.length > 1) {
        run(
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
      expect(readFileSync(path.join(projectDirectory, ".gitignore"), "utf8")).toContain(
        "node_modules",
      );
      const aitArtifactsBeforeBuild = new Set(findAitArtifacts(projectDirectory));
      run("npm", ["run", "build"], projectDirectory, generatedProjectEnvironment());
      expect(existsSync(path.join(projectDirectory, "dist", "index.html"))).toBe(true);
      const newAitArtifacts = findAitArtifacts(projectDirectory).filter(
        (artifact) => !aitArtifactsBeforeBuild.has(artifact),
      );
      expect(newAitArtifacts, "ait build가 새로운 .ait 파일을 만들지 않았어요.").not.toHaveLength(
        0,
      );

      const devServer = spawn("npm", ["run", "dev"], {
        cwd: projectDirectory,
        detached: process.platform !== "win32",
        env: generatedProjectEnvironment(),
        stdio: ["ignore", "pipe", "pipe"],
      });
      running.add(devServer);
      await waitForDevServer(devServer);
      expect(devServer.exitCode).toBeNull();
      await stopProcessTree(devServer);
      running.delete(devServer);
    },
    180_000,
  );
});
