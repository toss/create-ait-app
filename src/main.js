const { execSync } = require("child_process");
const { select, confirm, input, checkbox } = require("@inquirer/prompts");
const path = require("path");
const fs = require("fs");
const https = require("https");
const http = require("http");
const zlib = require("zlib");

function toNpmPackageName(input) {
  const raw = String(input || "").trim();
  if (!raw) return "my-app";

  // Allow scoped packages: @scope/name
  if (raw.startsWith("@")) {
    const slash = raw.indexOf("/");
    if (slash > 1) {
      const scope = raw.slice(0, slash).toLowerCase();
      const name = raw.slice(slash + 1);
      const normalizedName = toNpmPackageName(name);
      return `${scope}/${normalizedName}`;
    }
  }

  return (
    raw
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9._-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^[._-]+/, "")
      .replace(/[._-]+$/, "") || "my-app"
  );
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.name.startsWith("__")) continue;

    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * 샘플별 App.tsx 주입용 메타데이터.
 * 새 샘플 추가 시: 1) template/../__samples/<id>/ 폴더 추가, 2) 여기에 항목 추가
 */
const SAMPLE_CONFIG = {
  iap: {
    displayName: "인앱결제",
    import: 'import { InAppPurchasePage } from "./pages/InAppPurchasePage";',
    route:
      '  if (page === "iap") return <InAppPurchasePage onBack={() => setPage(null)} />;',
    getButton: (useTds) =>
      useTds
        ? '<Button color="dark" variant="weak" onClick={() => setPage("iap")}>인앱결제 테스트하기</Button>'
        : '<button type="button" className="app-button app-button-ghost" onClick={() => setPage("iap")}>인앱결제 테스트하기</button>',
  },
  iaa: {
    displayName: "인앱광고",
    import: 'import { InAppAdsPage } from "./pages/InAppAdsPage";',
    route:
      '  if (page === "iaa") return <InAppAdsPage onBack={() => setPage(null)} />;',
    getButton: (useTds) =>
      useTds
        ? '<Button color="dark" variant="weak" onClick={() => setPage("iaa")}>인앱광고 테스트하기</Button>'
        : '<button type="button" className="app-button app-button-ghost" onClick={() => setPage("iaa")}>인앱광고 테스트하기</button>',
  },
};

const SAMPLE_PRIMARY_COLOR = [
  "#FF8A65",
  "#FD9B3C",
  "#E0B20C",
  "#3FD599",
  "#81C784",
  "#4DB6AC",
  "#4DD0E1",
  "#64B5F6",
  "#655DFF",
  "#9575CD",
  "#BA68C8",
  "#FF91D5",
  "#F06292",
  "#D7B59E",
];

function fetchText(url) {
  return new Promise((resolve, reject) => {
    const get = (targetUrl) => {
      const client = targetUrl.startsWith("https") ? https : http;
      const req = client.get(
        targetUrl,
        { headers: { "Accept-Encoding": "gzip, deflate" } },
        (res) => {
          if (
            res.statusCode >= 300 &&
            res.statusCode < 400 &&
            res.headers.location
          ) {
            get(res.headers.location);
            return;
          }
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode} for ${targetUrl}`));
            return;
          }

          let stream = res;
          const encoding = res.headers["content-encoding"];
          if (encoding === "gzip") {
            stream = res.pipe(zlib.createGunzip());
          } else if (encoding === "deflate") {
            stream = res.pipe(zlib.createInflate());
          }

          let data = "";
          stream.setEncoding("utf-8");
          stream.on("data", (chunk) => (data += chunk));
          stream.on("end", () => resolve(data));
          stream.on("error", reject);
        },
      );
      req.on("error", reject);
    };
    get(url);
  });
}

function parseArgs(argv) {
  const args = { _: [], sample: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--pm" && argv[i + 1]) {
      args.pm = argv[++i];
    } else if (argv[i] === "--ai" && argv[i + 1]) {
      args.ai = argv[++i];
    } else if (
      argv[i] === "--sample" &&
      argv[i + 1] &&
      !argv[i + 1].startsWith("--")
    ) {
      args.sample.push(...argv[++i].split(","));
    } else if (argv[i].startsWith("--")) {
      args[argv[i].slice(2)] = true;
    } else {
      args._.push(argv[i]);
    }
  }
  return args;
}

function printHelp() {
  console.log(`
사용법: create-ait-app [project-name] [options]

options:
  --inline         질문을 생략하고 옵션만으로 설정합니다 (옵션 미지정 시 모두 n)
  --pm <name>      패키지 매니저를 지정합니다 (npm, yarn, pnpm)
  --tds            TDS(Toss Design System, React 필수) 패키지를 설치합니다 (기본값: 사용 안 함)
  --skills         AI를 위한 skills 파일을 추가합니다
  --ai <name>      AI 도구를 지정합니다 (cursor, claude, codex)
  --sample <name>  예제 코드를 추가합니다 (iap, iaa / 복수선택: iap,iaa)
  --help           이 도움말을 출력합니다

links:
  앱인토스 콘솔             https://apps-in-toss.toss.im/
  앱인토스 개발자센터       https://developers-apps-in-toss.toss.im/
  앱인토스 개발자 커뮤니티  https://techchat-apps-in-toss.toss.im/
`);
}

async function main() {
  const cliArgs = parseArgs(process.argv.slice(2));

  if (cliArgs.help) {
    printHelp();
    return;
  }

  const isInline = cliArgs.inline;
  const hasAnyOptionFlag =
    cliArgs.tds || cliArgs.skills || cliArgs.sample.length > 0;

  const projectName =
    cliArgs._[0] ||
    (await input({
      message: "프로젝트 이름을 입력하세요:",
      required: true,
    }));

  const targetDir = path.resolve(process.cwd(), projectName);
  const packageName = toNpmPackageName(projectName);

  if (fs.existsSync(targetDir) && fs.readdirSync(targetDir).length > 0) {
    console.error(
      `\n❌ "${projectName}" 디렉토리가 이미 존재하고 비어있지 않습니다.`,
    );
    process.exit(1);
  }

  const validPms = ["npm", "yarn", "pnpm"];
  let packageManager;

  if (cliArgs.pm) {
    if (!validPms.includes(cliArgs.pm)) {
      console.error(
        `\n❌ 지원하지 않는 패키지 매니저입니다: ${cliArgs.pm} (npm, yarn, pnpm 중 선택)`,
      );
      process.exit(1);
    }
    packageManager = cliArgs.pm;
  } else {
    packageManager = await select({
      message: "사용할 패키지 매니저를 선택하세요:",
      choices: [
        { name: "npm", value: "npm" },
        { name: "yarn", value: "yarn" },
        { name: "pnpm", value: "pnpm" },
      ],
    });
  }

  // --- 3. TDS ---
  let useTds;
  if (cliArgs.tds) {
    useTds = true;
  } else if (isInline) {
    useTds = false;
  } else if (hasAnyOptionFlag) {
    useTds = false;
  } else {
    useTds = await confirm({
      message:
        "TDS(Toss Design System)를 사용할까요? (앱인토스에 필수 아님, 기본값: 사용 안 함)",
      default: false,
    });
  }

  // --- 4. AI skills ---
  let useSkills;
  let aiTool;
  if (cliArgs.skills) {
    useSkills = true;
    const validAiTools = ["cursor", "claude", "codex"];
    aiTool = cliArgs.ai;
    if (aiTool && !validAiTools.includes(aiTool)) {
      console.error(
        `\n❌ 지원하지 않는 AI 도구입니다: ${aiTool} (cursor, claude, codex 중 선택)`,
      );
      process.exit(1);
    }
    if (!aiTool) {
      aiTool = await select({
        message: "사용하는 AI 도구를 선택하세요:",
        choices: [
          { name: "Cursor", value: "cursor" },
          { name: "Claude Code", value: "claude" },
          { name: "Codex", value: "codex" },
        ],
      });
    }
  } else if (isInline || hasAnyOptionFlag) {
    useSkills = false;
  } else {
    aiTool = await select({
      message: "AI를 위한 skills를 추가할까요?",
      choices: [
        { name: "Cursor", value: "cursor" },
        { name: "Claude Code", value: "claude" },
        { name: "Codex", value: "codex" },
        { name: "선택안함", value: "none" },
      ],
    });
    useSkills = aiTool !== "none";
  }

  // --- 5. 예제 코드 (복수 선택 가능) ---
  const validSamples = Object.keys(SAMPLE_CONFIG);
  let sampleChoices = [];
  if (cliArgs.sample.length > 0) {
    const invalid = cliArgs.sample.filter((s) => !validSamples.includes(s));
    if (invalid.length > 0) {
      console.error(
        `\n❌ 지원하지 않는 예제 코드입니다: ${invalid.join(", ")} (${validSamples.join(", ")} 중 선택)`,
      );
      process.exit(1);
    }
    sampleChoices = [...new Set(cliArgs.sample)];
  } else if (isInline) {
    sampleChoices = [];
  } else if (hasAnyOptionFlag) {
    sampleChoices = [];
  } else {
    const sampleChoiceList = validSamples.map((id) => ({
      name: SAMPLE_CONFIG[id].displayName,
      value: id,
    }));
    sampleChoices = await checkbox({
      message: "예제 코드를 추가할까요? (복수 선택 가능)",
      choices: sampleChoiceList,
    });
  }

  console.log(`\n🚀 프로젝트를 생성합니다...\n`);

  const templateDir = path.resolve(__dirname, "..", "template");

  try {
    copyDir(templateDir, targetDir);

    if (useTds) {
      copyDir(path.resolve(templateDir, "__tds"), targetDir);
    } else {
      copyDir(path.resolve(templateDir, "__default"), targetDir);
    }

    // package.json name 치환 (TDS 선택 시 React 18 사용 — TDS peer dependency)
    const pkgPath = path.join(targetDir, "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    pkg.name = packageName;
    if (useTds) {
      pkg.dependencies.react = "^18.0.0";
      pkg.dependencies["react-dom"] = "^18.0.0";
      if (pkg.devDependencies["@types/react"])
        pkg.devDependencies["@types/react"] = "^18.0.0";
      if (pkg.devDependencies["@types/react-dom"])
        pkg.devDependencies["@types/react-dom"] = "^18.0.0";
    }
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

    // pnpm: shamefully-hoist 설정 (granite가 Vite 플러그인을 찾을 수 있도록)
    if (packageManager === "pnpm") {
      fs.writeFileSync(
        path.join(targetDir, ".npmrc"),
        "shamefully-hoist=true\n",
      );
    }

    // granite.config.ts appName 치환
    const configPath = path.join(targetDir, "granite.config.ts");
    const configContent = fs.readFileSync(configPath, "utf-8");
    fs.writeFileSync(
      configPath,
      configContent
        .replace("{{APP_NAME}}", projectName)
        .replace(
          "{{PRIMARY_COLOR}}",
          SAMPLE_PRIMARY_COLOR[
            Math.floor(Math.random() * SAMPLE_PRIMARY_COLOR.length)
          ],
        ),
    );

    // README.md 프로젝트명 + 선택한 패키지 매니저 명령어 치환
    const readmePath = path.join(targetDir, "README.md");
    const pmDev =
      packageManager === "npm" ? "npm run dev" : `${packageManager} dev`;
    const pmBuild =
      packageManager === "npm" ? "npm run build" : `${packageManager} build`;
    const pmDeploy =
      packageManager === "npm" ? "npm run deploy" : `${packageManager} deploy`;

    let readmeContent = fs.readFileSync(readmePath, "utf-8");
    readmeContent = readmeContent
      .replace(/\{\{APP_NAME\}\}/g, projectName)
      .replace(/\{\{PM_DEV\}\}/g, pmDev)
      .replace(/\{\{PM_BUILD\}\}/g, pmBuild)
      .replace(/\{\{PM_DEPLOY\}\}/g, pmDeploy);
    fs.writeFileSync(readmePath, readmeContent);

    // 예제 코드: 선택한 샘플만 template/../__samples/<id> 에서 src 로 복사 후 App.tsx 플레이스홀더 치환
    const samplesDir = path.join(
      path.resolve(templateDir, useTds ? "__tds" : "__default"),
      "__samples",
    );

    for (const id of sampleChoices) {
      const sampleRoot = path.join(samplesDir, id);

      copyDir(sampleRoot, targetDir);
    }

    const srcDir = path.join(targetDir, "src");
    const appPath = path.join(srcDir, "App.tsx");
    let appContent = fs.existsSync(appPath)
      ? fs.readFileSync(appPath, "utf-8")
      : null;

    if (appContent) {
      const hasSamples = sampleChoices.length > 0;
      const sampleImports = hasSamples
        ? sampleChoices
            .map((id) => SAMPLE_CONFIG[id]?.import)
            .filter(Boolean)
            .join("\n") + '\nimport { useState } from "react";'
        : "";
      const pageStateAndRoutes = hasSamples
        ? "  const [page, setPage] = useState<string | null>(null);\n\n" +
          sampleChoices
            .map((id) => SAMPLE_CONFIG[id]?.route)
            .filter(Boolean)
            .join("\n") +
          "\n\n"
        : "";
      const sampleButtons = hasSamples
        ? sampleChoices
            .map((id) => SAMPLE_CONFIG[id]?.getButton(useTds))
            .filter(Boolean)
            .join("\n\n        ")
        : "";

      appContent = appContent
        .replace("{{SAMPLE_IMPORTS}}", sampleImports)
        .replace("{{PAGE_STATE_AND_ROUTES}}", pageStateAndRoutes)
        .replace("{{SAMPLE_BUTTONS}}", sampleButtons);
      fs.writeFileSync(appPath, appContent);
    }

    // 의존성 설치
    console.log(`📦 의존성을 설치합니다...\n`);

    const installCommands = {
      npm: "npm install",
      yarn: "yarn",
      pnpm: "pnpm install",
    };
    execSync(installCommands[packageManager], {
      stdio: "inherit",
      cwd: targetDir,
    });

    console.log(`\n📦 @apps-in-toss/web-framework 최신 버전을 설치합니다...\n`);

    const addCmd = { npm: "npm install", yarn: "yarn add", pnpm: "pnpm add" };
    execSync(`${addCmd[packageManager]} @apps-in-toss/web-framework@latest`, {
      stdio: "inherit",
      cwd: targetDir,
    });

    // TDS 설치
    if (useTds) {
      console.log(`\n📦 TDS 패키지를 설치합니다...\n`);
      const tdsPackages =
        "@toss/tds-mobile @toss/tds-mobile-ait @toss/tds-colors @emotion/react@^11 react@^18 react-dom@^18";
      execSync(`${addCmd[packageManager]} ${tdsPackages}`, {
        stdio: "inherit",
        cwd: targetDir,
      });
    }

    // AI skills
    if (useSkills) {
      console.log(`\n📄 AI skills 파일을 추가합니다... (${aiTool})\n`);

      const aitDocs = await fetchText(
        "https://developers-apps-in-toss.toss.im/llms.txt",
      );
      let tdsDocs;
      if (useTds) {
        tdsDocs = await fetchText(
          "https://tossmini-docs.toss.im/tds-mobile/llms-full.txt",
        );
      }

      if (aiTool === "cursor") {
        const skillsDir = path.join(targetDir, ".cursor", "skills");
        fs.mkdirSync(skillsDir, { recursive: true });
        fs.writeFileSync(path.join(skillsDir, "apps-in-toss.md"), aitDocs);
        console.log("  ✓ .cursor/skills/apps-in-toss.md 추가 완료");
        if (tdsDocs) {
          fs.writeFileSync(path.join(skillsDir, "tds-mobile.md"), tdsDocs);
          console.log("  ✓ .cursor/skills/tds-mobile.md 추가 완료");
        }
      } else if (aiTool === "claude") {
        const docsDir = path.join(targetDir, "docs", "skills");
        fs.mkdirSync(docsDir, { recursive: true });

        fs.writeFileSync(path.join(docsDir, "apps-in-toss.md"), aitDocs);
        console.log("  ✓ docs/skills/apps-in-toss.md 추가 완료");

        if (tdsDocs) {
          fs.writeFileSync(path.join(docsDir, "tds-mobile.md"), tdsDocs);
          console.log("  ✓ docs/skills/tds-mobile.md 추가 완료");
        }

        let claudeMd = "@docs/skills/apps-in-toss.md\n";
        if (tdsDocs) {
          claudeMd += "@docs/skills/tds-mobile.md\n";
        }
        fs.writeFileSync(path.join(targetDir, "CLAUDE.md"), claudeMd);
        console.log("  ✓ CLAUDE.md 추가 완료");
      } else if (aiTool === "codex") {
        const docsDir = path.join(targetDir, "docs", "skills");
        fs.mkdirSync(docsDir, { recursive: true });

        fs.writeFileSync(path.join(docsDir, "apps-in-toss.md"), aitDocs);
        console.log("  ✓ docs/skills/apps-in-toss.md 추가 완료");

        if (tdsDocs) {
          fs.writeFileSync(path.join(docsDir, "tds-mobile.md"), tdsDocs);
          console.log("  ✓ docs/skills/tds-mobile.md 추가 완료");
        }

        let agentsMd = "docs/skills/apps-in-toss.md 파일을 참고하세요.\n";
        if (tdsDocs) {
          agentsMd += "docs/skills/tds-mobile.md 파일을 참고하세요.\n";
        }
        fs.writeFileSync(path.join(targetDir, "AGENTS.md"), agentsMd);
        console.log("  ✓ AGENTS.md 추가 완료");
      }
    }

    // 코드 포맷팅
    console.log(`\n📐 코드 포맷팅을 실행합니다...\n`);
    const formatCmd =
      packageManager === "npm" ? "npm run format" : `${packageManager} format`;
    execSync(formatCmd, { stdio: "inherit", cwd: targetDir });

    console.log(`
✅ 프로젝트가 성공적으로 생성되었습니다!

  cd ${projectName}
  ${packageManager === "npm" ? "npm run dev" : `${packageManager} dev`}
`);
  } catch (error) {
    console.error("\n❌ 프로젝트 생성 중 오류가 발생했습니다:", error.message);
    process.exit(1);
  }
}

module.exports = { main };
