const fs = require("fs");
const path = require("path");
const { fetchText } = require("./utils/fetch-text");

async function writeAiSkills({ targetDir, aiTool, useTds }) {
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

module.exports = { writeAiSkills };
