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

module.exports = { parseArgs, printHelp };
