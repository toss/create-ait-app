const { execSync } = require("child_process");
const { select, confirm, input, checkbox } = require("@inquirer/prompts");
const path = require("path");
const fs = require("fs");
const https = require("https");
const http = require("http");
const zlib = require("zlib");

const TEMPLATES_DIR = path.resolve(__dirname, "..", "templates");

const TEMPLATE_IDS = ["react-ts", "react", "js", "ts"];

/**
 * React + TypeScript 샘플 주입 메타데이터 (react-ts)
 */
const REACT_SAMPLE_CONFIG = {
  iap: {
    displayName: "인앱결제",
    import: 'import { InAppPurchasePage } from "./pages/InAppPurchasePage";',
    route:
      '  if (page === "iap") return <InAppPurchasePage onBack={() => setPage(null)} />;',
    getButton: () =>
      '<button type="button" className="app-button app-button-ghost" onClick={() => setPage("iap")}>인앱결제 테스트하기</button>',
  },
  iaa: {
    displayName: "인앱광고",
    import: 'import { InAppAdsPage } from "./pages/InAppAdsPage";',
    route:
      '  if (page === "iaa") return <InAppAdsPage onBack={() => setPage(null)} />;',
    getButton: () =>
      '<button type="button" className="app-button app-button-ghost" onClick={() => setPage("iaa")}>인앱광고 테스트하기</button>',
  },
};

/**
 * React + JavaScript 샘플 주입 메타데이터 (react)
 */
const REACT_JS_SAMPLE_CONFIG = {
  iap: {
    displayName: "인앱결제",
    import:
      'import { InAppPurchasePage } from "./pages/InAppPurchasePage.jsx";',
    route:
      '  if (page === "iap") return <InAppPurchasePage onBack={() => setPage(null)} />;',
    getButton: () =>
      '<button type="button" className="app-button app-button-ghost" onClick={() => setPage("iap")}>인앱결제 테스트하기</button>',
  },
  iaa: {
    displayName: "인앱광고",
    import: 'import { InAppAdsPage } from "./pages/InAppAdsPage.jsx";',
    route:
      '  if (page === "iaa") return <InAppAdsPage onBack={() => setPage(null)} />;',
    getButton: () =>
      '<button type="button" className="app-button app-button-ghost" onClick={() => setPage("iaa")}>인앱광고 테스트하기</button>',
  },
};

/**
 * React + TypeScript + TDS 샘플 주입 메타데이터 (react-ts-tds)
 */
const REACT_TDS_SAMPLE_CONFIG = {
  iap: {
    displayName: "인앱결제",
    import: 'import { InAppPurchasePage } from "./pages/InAppPurchasePage";',
    route:
      '  if (page === "iap") return <InAppPurchasePage onBack={() => setPage(null)} />;',
    getButton: () =>
      '<Button color="dark" variant="weak" onClick={() => setPage("iap")}>인앱결제 테스트하기</Button>',
  },
  iaa: {
    displayName: "인앱광고",
    import: 'import { InAppAdsPage } from "./pages/InAppAdsPage";',
    route:
      '  if (page === "iaa") return <InAppAdsPage onBack={() => setPage(null)} />;',
    getButton: () =>
      '<Button color="dark" variant="weak" onClick={() => setPage("iaa")}>인앱광고 테스트하기</Button>',
  },
};

/**
 * Vanilla JavaScript 샘플 주입 메타데이터 (js)
 */
const JS_SAMPLE_CONFIG = {
  iap: {
    displayName: "인앱결제",
    import:
      'import { mountInAppPurchasePage } from "./pages/InAppPurchasePage.js";',
    route: `  if (currentPage === "iap") {
    mountInAppPurchasePage(() => {
      currentPage = null;
      render();
    });
    return;
  }`,
    getButton: () =>
      '<button type="button" class="app-button app-button-ghost" data-page="iap">인앱결제 테스트하기</button>',
  },
  iaa: {
    displayName: "인앱광고",
    import: 'import { mountInAppAdsPage } from "./pages/InAppAdsPage.js";',
    route: `  if (currentPage === "iaa") {
    mountInAppAdsPage(() => {
      currentPage = null;
      render();
    });
    return;
  }`,
    getButton: () =>
      '<button type="button" class="app-button app-button-ghost" data-page="iaa">인앱광고 테스트하기</button>',
  },
};

/**
 * Vanilla TypeScript 샘플 주입 메타데이터 (ts)
 */
const TS_SAMPLE_CONFIG = {
  iap: {
    displayName: "인앱결제",
    import:
      'import { mountInAppPurchasePage } from "./pages/InAppPurchasePage.ts";',
    route: `  if (currentPage === "iap") {
    mountInAppPurchasePage(() => {
      currentPage = null;
      render();
    });
    return;
  }`,
    getButton: () =>
      '<button type="button" class="app-button app-button-ghost" data-page="iap">인앱결제 테스트하기</button>',
  },
  iaa: {
    displayName: "인앱광고",
    import: 'import { mountInAppAdsPage } from "./pages/InAppAdsPage.ts";',
    route: `  if (currentPage === "iaa") {
    mountInAppAdsPage(() => {
      currentPage = null;
      render();
    });
    return;
  }`,
    getButton: () =>
      '<button type="button" class="app-button app-button-ghost" data-page="iaa">인앱광고 테스트하기</button>',
  },
};

const TEMPLATE_REGISTRY = {
  "react-ts": {
    appFile: "src/App.tsx",
    isVanilla: false,
    isTypeScript: true,
    useTds: false,
    sampleConfig: REACT_SAMPLE_CONFIG,
  },
  react: {
    appFile: "src/App.jsx",
    isVanilla: false,
    isTypeScript: false,
    useTds: false,
    sampleConfig: REACT_JS_SAMPLE_CONFIG,
  },
  "react-ts-tds": {
    appFile: "src/App.tsx",
    isVanilla: false,
    isTypeScript: true,
    useTds: true,
    sampleConfig: REACT_TDS_SAMPLE_CONFIG,
  },
  js: {
    appFile: "src/app.js",
    isVanilla: true,
    isTypeScript: false,
    useTds: false,
    sampleConfig: JS_SAMPLE_CONFIG,
  },
  ts: {
    appFile: "src/app.ts",
    isVanilla: true,
    isTypeScript: true,
    useTds: false,
    sampleConfig: TS_SAMPLE_CONFIG,
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

function toNpmPackageName(input) {
  const raw = String(input || "").trim();
  if (!raw) return "my-app";

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

function copyDir(src, dest, { exclude = [] } = {}) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (exclude.includes(entry.name)) continue;

    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, { exclude });
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const TEMPLATE_CHOICES = [
  { name: "react-ts — React + TypeScript (기본)", value: "react-ts" },
  { name: "react — React + JavaScript", value: "react" },
  { name: "js — Vanilla JavaScript", value: "js" },
  { name: "ts — Vanilla TypeScript", value: "ts" },
];

function resolveTemplateFolder(baseTemplateId, useTds) {
  if (baseTemplateId === "react-ts" && useTds) return "react-ts-tds";
  return baseTemplateId;
}

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
    } else if (argv[i] === "--template" && argv[i + 1]) {
      args.template = argv[++i];
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
  --inline           질문을 생략하고 옵션만으로 설정합니다 (옵션 미지정 시 모두 n)
  --pm <name>        패키지 매니저를 지정합니다 (npm, yarn, pnpm)
  --template <name>  템플릿을 지정합니다 (기본값: react-ts)
  --tds              react-ts 템플릿에서 TDS를 사용합니다 (다른 템플릿에서는 무시)
  --skills           AI를 위한 skills 파일을 추가합니다
  --ai <name>        AI 도구를 지정합니다 (cursor, claude, codex)
  --sample <name>    예제 코드를 추가합니다 (iap, iaa / 복수선택: iap,iaa)
  --help             이 도움말을 출력합니다

templates:
  react-ts           React + TypeScript (기본)
  react              React + JavaScript
  js                 Vanilla JavaScript
  ts                 Vanilla TypeScript

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
    cliArgs.template || cliArgs.tds || cliArgs.skills || cliArgs.sample.length > 0;

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

  // --- 템플릿 선택 ---
  let baseTemplateId = null;

  if (cliArgs.template) {
    if (cliArgs.template === "react-ts-tds") {
      console.error(
        "\n❌ react-ts-tds는 더 이상 템플릿 이름으로 사용할 수 없습니다. --template react-ts --tds를 사용해 주세요.",
      );
      process.exit(1);
    }
    if (!TEMPLATE_IDS.includes(cliArgs.template)) {
      console.error(
        `\n❌ 지원하지 않는 템플릿입니다: ${cliArgs.template} (${TEMPLATE_IDS.join(", ")} 중 선택)`,
      );
      process.exit(1);
    }
    baseTemplateId = cliArgs.template;
  } else if (isInline || hasAnyOptionFlag) {
    baseTemplateId = "react-ts";
  } else {
    baseTemplateId = await select({
      message: "사용할 템플릿을 선택하세요:",
      choices: TEMPLATE_CHOICES,
    });
  }

  let useTds = false;
  if (cliArgs.tds) {
    useTds = baseTemplateId === "react-ts";
  } else if (!isInline && !hasAnyOptionFlag && baseTemplateId === "react-ts") {
    useTds = await confirm({
      message:
        "TDS(Toss Design System)를 사용할까요? (앱인토스에 필수 아님, 기본값: 사용 안 함)",
      default: false,
    });
  }

  const templateId = resolveTemplateFolder(baseTemplateId, useTds);
  const template = TEMPLATE_REGISTRY[templateId];
  const templateDir = path.join(TEMPLATES_DIR, templateId);

  if (!fs.existsSync(templateDir)) {
    console.error(`\n❌ 템플릿을 찾을 수 없습니다: templates/${templateId}`);
    process.exit(1);
  }

  const sampleConfig = template.sampleConfig;

  // --- AI skills ---
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

  // --- 예제 코드 ---
  const validSamples = Object.keys(sampleConfig);
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
  } else if (isInline || hasAnyOptionFlag) {
    sampleChoices = [];
  } else {
    const sampleChoiceList = validSamples.map((id) => ({
      name: sampleConfig[id].displayName,
      value: id,
    }));
    sampleChoices = await checkbox({
      message: "예제 코드를 추가할까요? (복수 선택 가능)",
      choices: sampleChoiceList,
    });
  }

  console.log(
    `\n🚀 프로젝트를 생성합니다... (templates/${templateId}${useTds ? ", TDS" : ""})\n`,
  );

  try {
    copyDir(templateDir, targetDir, { exclude: ["samples"] });

    const pkgPath = path.join(targetDir, "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    pkg.name = packageName;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

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

    const samplesDir = path.join(templateDir, "samples");
    for (const id of sampleChoices) {
      const sampleRoot = path.join(samplesDir, id);
      if (fs.existsSync(sampleRoot)) {
        copyDir(sampleRoot, targetDir);
      }
    }

    const appPath = path.join(targetDir, template.appFile);
    if (fs.existsSync(appPath)) {
      let appContent = fs.readFileSync(appPath, "utf-8");
      appContent = template.isVanilla
        ? injectVanillaSamples(appContent, sampleChoices, sampleConfig)
        : injectReactSamples(
            appContent,
            sampleChoices,
            sampleConfig,
            template.isTypeScript,
          );
      fs.writeFileSync(appPath, appContent);
    }

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

    if (useSkills) {
      console.log(`\n📄 AI skills 파일을 추가합니다... (${aiTool})\n`);

      const aitDocs = await fetchText(
        "https://developers-apps-in-toss.toss.im/llms.txt",
      );
      let tdsDocs;
      if (template.useTds) {
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

    console.log(`\n📐 코드 포맷팅을 실행합니다...\n`);
    const formatCmd =
      packageManager === "npm" ? "npm run format" : `${packageManager} format`;
    execSync(formatCmd, { stdio: "inherit", cwd: targetDir });

    console.log(`
✅ 프로젝트가 성공적으로 생성되었습니다!

  템플릿: templates/${templateId}
  cd ${projectName}
  ${packageManager === "npm" ? "npm run dev" : `${packageManager} dev`}
`);
  } catch (error) {
    console.error("\n❌ 프로젝트 생성 중 오류가 발생했습니다:", error.message);
    process.exit(1);
  }
}

module.exports = {
  main,
  TEMPLATE_IDS,
  TEMPLATE_REGISTRY,
  TEMPLATE_CHOICES,
  resolveTemplateFolder,
};
