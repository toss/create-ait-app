# create-ait-app

앱인토스(Apps in Toss) 프로젝트를 빠르게 시작할 수 있는 CLI 도구예요.
Vite 기반 React + TypeScript 프로젝트를 생성하고, TDS/인앱결제/인앱광고 등을 선택적으로 구성할 수 있어요.

## 사용법

```bash
npx create-ait-app my-app
```

실행하면 대화형 프롬프트로 아래 항목을 선택할 수 있어요.

1. **패키지 매니저** — npm, yarn, pnpm 중 선택
2. **TDS (Toss Design System)** — TDS 패키지 설치 여부
3. **AI Skills** — AI 도구를 위한 SDK 문서 파일 추가 여부 (Cursor / Claude Code / Codex / 선택안함)
4. **예제 코드** — 인앱결제, 인앱광고 샘플 코드 추가 (복수 선택 가능)

## CLI 옵션

프롬프트 없이 한 줄로 설정할 수도 있어요.

```bash
create-ait-app my-app --inline --pm yarn --tds --skills --ai cursor --sample iap,iaa
```

| 옵션              | 설명                                                            |
| ----------------- | --------------------------------------------------------------- |
| `--inline`        | 대화형 질문을 생략하고 옵션만으로 설정 (미지정 항목은 모두 `n`) |
| `--pm <name>`     | 패키지 매니저 지정 (`npm`, `yarn`, `pnpm`)                      |
| `--tds`           | TDS 패키지 설치                                                 |
| `--skills`        | AI Skills 파일 추가                                             |
| `--ai <name>`     | AI 도구 지정 (`cursor`, `claude`, `codex`)                      |
| `--sample <name>` | 예제 코드 추가 (`iap`, `iaa` / 복수: `iap,iaa`)                 |
| `--help`          | 도움말 출력                                                     |

## 생성되는 프로젝트 구조

- 기본 템플릿은 최소 구성(헤더, 개발자센터/커뮤니티 링크 등)만 포함합니다.
- **예제 코드**를 선택한 경우에만 `src/hooks/`, `src/pages/` 및 해당 파일들이 추가됩니다.

```
my-app/
├── src/
│   ├── App.tsx
│   ├── App.css
│   ├── main.tsx
│   ├── index.css
│   ├── vite-env.d.ts
│   ├── hooks/           # --sample iap/iaa 선택 시에만 추가
│   └── pages/           # --sample iap/iaa 선택 시에만 추가
├── public/
├── granite.config.ts
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

## 개발 (이 CLI 도구 자체)

```bash
# 의존성 설치
npm install

# 로컬에서 CLI 테스트
npm link
create-ait-app test-project

# 링크 해제
npm unlink -g create-ait-app
```

## 관련 링크

- [앱인토스 콘솔](https://apps-in-toss.toss.im/)
- [앱인토스 개발자센터](https://developers-apps-in-toss.toss.im/)
- [앱인토스 개발자 커뮤니티](https://techchat-apps-in-toss.toss.im/)
- [AI를 위한 LLMs 문서](https://developers-apps-in-toss.toss.im/development/llms.html)
