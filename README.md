# create-ait-app

Vite 정적 클라이언트 프로젝트에 Apps in Toss 설정을 얹어 주는 CLI예요.

일반 프로젝트는 CLI가 자체 템플릿을 복사하지 않아요. 저장소에 고정된 `create-vite`로
프로젝트를 먼저 만든 뒤, 정적 클라이언트 결과를 만들 수 있는지 확인하고
`@apps-in-toss/web-framework`와 `granite.config.ts`를 추가해요. TDS를 선택한
경우에만 React 18 전용 템플릿을 사용해요.

Node.js 24 이상이 필요해요.

## 빠르게 시작하기

```bash
npx create-ait-app my-app
cd my-app
npm run dev
```

대화형 실행에서는 `create-vite`가 현재 제공하는 프리셋 선택 화면을 그대로 사용해요.
따라서 React, Vue, Svelte, Solid, Preact, Lit, Qwik, Vanilla와 각 TypeScript 변형처럼
고정된 `create-vite` 버전에 포함된 프리셋을 선택할 수 있어요.

## CLI 옵션

프롬프트 없이 생성하려면 `--inline`을 사용해 주세요.

```bash
npx create-ait-app my-app --inline --pm yarn --template vue-ts
```

| 옵션                | 설명                                                                |
| ------------------- | ------------------------------------------------------------------- |
| `--inline`          | 대화형 질문을 생략해요. 기본 프리셋은 `react-ts`예요.               |
| `--pm <name>`       | 패키지 매니저를 지정해요. `npm`, `yarn`, `pnpm`을 지원해요.         |
| `--template <name>` | `create-vite` 프리셋을 지정해요. 예: `vue-ts`, `svelte`, `solid-ts` |
| `--tds`             | React 18 + TypeScript + TDS 전용 템플릿을 사용해요.                 |
| `--skills`          | 최신 공식 문서를 조회하는 Agent Skills를 추가해요.                  |
| `--ai <name>`       | Skills 대상 도구를 지정해요. `cursor`, `claude`, `codex`            |
| `--sample <name>`   | `iap`, `iaa` 예제를 추가해요. 쉼표로 여러 개를 지정할 수 있어요.    |
| `--skip-install`    | 프로젝트 생성 뒤 의존성 설치를 생략해요.                            |
| `--help`            | 도움말을 출력해요.                                                  |

이전 이름과의 호환을 위해 `js`는 `vanilla`, `ts`는 `vanilla-ts`로 해석해요.

## 정적 클라이언트 검증

순수 CSR뿐 아니라 빌드 시 HTML을 생성하고 클라이언트에서 hydration하는 SSG도
지원해요. 반면 요청마다 서버 런타임이 필요한 SSR 전용 프로젝트는 지원하지 않아요.
생성 직후 다음 조건을 검사하며, 조건을 만족하지 않으면 생성된 디렉터리를 정리하고
실패해요.

- 루트 `index.html`과 `package.json`이 있어야 해요.
- Vite 의존성과 `dev`, `build` 스크립트가 있어야 해요.
- `build`가 Vite SSR 번들만 생성하는 명령이어서는 안 돼요.

원래 Vite 스크립트는 `dev:vite`, `build:vite`로 보존해요. Apps in Toss 명령은
`dev`, `build`, `deploy`로 제공해요.

## TDS

TDS는 React 18을 요구하므로 일반 `create-vite` 경로와 분리되어 있어요. TDS가 필요한
경우에만 전용 템플릿을 선택해 주세요.

```bash
npx create-ait-app my-app --inline --tds
```

`--tds`와 `--template`을 함께 사용한다면 `react-ts`만 지정할 수 있어요.

## 예제 코드

Apps in Toss 초기화가 끝나면 React, React TypeScript, Vanilla, Vanilla TypeScript,
React 18 + TDS 프로젝트에서 예제 코드를 추가할지 물어요. 프롬프트 없이 만들 때는
`--sample iap,iaa`로 같은 예제를 추가할 수 있어요. 임의의 다른 프레임워크 소스에는
코드를 안전하게 합치기 어려워 예제를 추가하지 않아요.

프로젝트를 만든 뒤 예제가 더 필요하면 `add-sample`을 사용할 수 있어요. 예제를
지정하지 않으면 아직 추가하지 않은 예제를 대화형으로 골라요.

```bash
# 현재 프로젝트에 대화형으로 추가
npx create-ait-app add-sample

# 경로와 예제를 직접 지정
npx create-ait-app add-sample ./my-app --sample iap,iaa
```

`add-sample`은 create-ait-app으로 만든 React, React TypeScript, Vanilla,
Vanilla TypeScript, TDS 프로젝트에서 사용할 수 있어요. 이미 추가된 예제는
건너뛰고 새 예제만 더해요.

## Agent Skills

프로젝트를 만들 때 사용 중인 AI 도구를 선택하면 필요한 Skills를 함께 설치해요.
일반 프로젝트에는 Apps in Toss Skill을, TDS 프로젝트에는 Apps in Toss와 TDS
Skills를 설치해요.

프롬프트 없이 만들 때는 `--skills`와 `--ai`를 함께 지정해 주세요.

```bash
npx create-ait-app my-app --inline --skills --ai codex
```

이미 만든 프로젝트에 나중에 추가하고 싶다면 프로젝트 루트에서
[vercel-labs/skills](https://github.com/vercel-labs/skills) CLI를 실행하면 돼요.
`--agent`에는 `cursor`, `codex`, `claude-code` 중 사용하는 도구를 넣어 주세요.

```bash
# Apps in Toss
npx --yes skills@latest add toss/create-ait-app \
  --agent codex \
  --skill apps-in-toss \
  --copy --yes

# Apps in Toss + TDS
npx --yes skills@latest add toss/create-ait-app \
  --agent codex \
  --skill apps-in-toss \
  --skill tds-mobile \
  --copy --yes
```

설치된 Skills는 작업할 때 최신 Apps in Toss 문서 인덱스를 읽어요. 필요한 개별
문서를 우선 확인하고, 여러 영역을 함께 다루거나 더 넓은 문맥이 필요할 때는
`llms-full.txt`를 검색해요.

## 관련 링크

- [Apps in Toss 콘솔](https://apps-in-toss.toss.im/)
- [Apps in Toss 개발자센터](https://developers-apps-in-toss.toss.im/)
- [Apps in Toss 개발자 커뮤니티](https://techchat-apps-in-toss.toss.im/)
- [Apps in Toss llms.txt](https://developers-apps-in-toss.toss.im/llms.txt)
- [Apps in Toss llms-full.txt](https://developers-apps-in-toss.toss.im/llms-full.txt)

기여 방법은 [CONTRIBUTING.md](./CONTRIBUTING.md)를 참고해 주세요.
