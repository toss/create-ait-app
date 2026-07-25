import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { getSupportedViteTemplates } from "../../src/vite.js";

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

afterEach(() => {
  for (const processHandle of running) {
    processHandle.kill("SIGTERM");
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
      if (requestedSamples) {
        cliArguments.push("--sample", requestedSamples);
      }

      run("corepack", cliArguments, process.cwd());
      run("npm", ["run", "build:vite"], projectDirectory, generatedProjectEnvironment());
      expect(existsSync(path.join(projectDirectory, "dist", "index.html"))).toBe(true);

      const aitArtifactsBeforeBuild = new Set(findAitArtifacts(projectDirectory));
      run("npm", ["run", "build"], projectDirectory, generatedProjectEnvironment());
      const newAitArtifacts = findAitArtifacts(projectDirectory).filter(
        (artifact) => !aitArtifactsBeforeBuild.has(artifact),
      );
      expect(newAitArtifacts, "ait build가 새로운 .ait 파일을 만들지 않았어요.").not.toHaveLength(
        0,
      );

      const devServer = spawn("npm", ["run", "dev"], {
        cwd: projectDirectory,
        env: generatedProjectEnvironment(),
        stdio: ["ignore", "pipe", "pipe"],
      });
      running.add(devServer);
      await waitForDevServer(devServer);
      expect(devServer.exitCode).toBeNull();
      devServer.kill("SIGTERM");
      running.delete(devServer);
    },
    180_000,
  );
});
