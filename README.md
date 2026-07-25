# create-ait-app

Vite CSR 프로젝트에 Apps in Toss 설정을 얹어 주는 CLI예요.

일반 프로젝트는 CLI가 자체 템플릿을 복사하지 않아요. 저장소에 고정된 `create-vite`로
프로젝트를 먼저 만든 뒤, CSR인지 확인하고 `@apps-in-toss/web-framework`와
`granite.config.ts`를 추가해요. TDS를 선택한 경우에만 React 18 전용 템플릿을 사용해요.

Node.js 24 이상이 필요해요.

## 빠르게 시작하기

```bash
npx create-ait-app my-app
cd my-app
npm run dev
```

대화형 실행에서는 `create-vite`가 현재 제공하는 프리셋 선택 화면을 그대로 사용해요.
따라서 React, Vue, Svelte, Solid, Preact, Lit, Qwik, Vanilla와 각 TypeScript 변형처럼
고정된 `create-vite` 버전에 포함된 CSR 프리셋을 선택할 수 있어요.

## CLI 옵션

프롬프트 없이 생성하려면 `--inline`을 사용하세요.

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

## CSR 검증

Apps in Toss 웹 프레임워크는 CSR 프로젝트를 대상으로 해요. 생성 직후 다음 조건을
검사하며, 조건을 만족하지 않으면 생성된 디렉터리를 정리하고 실패해요.

- 루트 `index.html`과 `package.json`이 있어야 해요.
- Vite 의존성과 `dev`, `build` 스크립트가 있어야 해요.
- Next.js, Nuxt, Astro, SvelteKit 등 알려진 SSR/메타 프레임워크 의존성이 없어야 해요.

원래 Vite 스크립트는 `dev:vite`, `build:vite`로 보존해요. Apps in Toss 명령은
`dev`, `build`, `deploy`로 제공해요.

## TDS

TDS는 React 18을 요구하므로 일반 `create-vite` 경로와 분리되어 있어요. TDS가 필요한
경우에만 전용 템플릿을 명시적으로 선택하세요.

```bash
npx create-ait-app my-app --inline --tds
```

`--tds`와 `--template`을 함께 사용한다면 `react-ts`만 지정할 수 있어요.

## 예제 코드

`--sample iap,iaa`는 React, Vanilla, React 18 + TDS 프로젝트에서 사용할 수 있어요.
임의의 CSR 프레임워크 소스에 코드를 안전하게 병합할 수 없으므로 다른 프리셋에서는
예제를 추가하지 않아요.

같은 이유로 기존 프로젝트를 수정하던 `add-sample` 명령은 제거했어요. 예제가 필요하면
프로젝트를 생성할 때 `--sample`을 지정하세요.

## Agent Skills

`--skills --ai <도구>`를 지정하면
[vercel-labs/skills](https://github.com/vercel-labs/skills)가 인식하는 구조로 Skills를
생성해요.

- Cursor와 Codex: `.agents/skills/`
- Claude Code: `.claude/skills/`

Skills에는 문서 본문 스냅샷을 넣지 않아요. 작업 시점의 `llms.txt`를 문서 인덱스로
읽고, 관련된 개별 문서를 우선 조회해요. 여러 영역을 함께 다루거나 인덱스만으로
충분하지 않을 때는 `llms-full.txt`를 검색하도록 라우팅 지침이 포함돼요.

## create-vite 버전 정책

`create-vite`는 재현 가능한 생성을 위해 정확한 버전으로 고정해요. 매일 실행되는
GitHub Actions가 npm의 최신 버전을 확인하고, 모든 프리셋에서 생성·설치·빌드·개발
서버 검증을 통과한 경우에만 버전 업데이트 PR을 만들어요.

## 관련 링크

- [Apps in Toss 콘솔](https://apps-in-toss.toss.im/)
- [Apps in Toss 개발자센터](https://developers-apps-in-toss.toss.im/)
- [Apps in Toss 개발자 커뮤니티](https://techchat-apps-in-toss.toss.im/)
- [Apps in Toss llms.txt](https://developers-apps-in-toss.toss.im/llms.txt)
- [Apps in Toss llms-full.txt](https://developers-apps-in-toss.toss.im/llms-full.txt)

기여 방법은 [CONTRIBUTING.md](./CONTRIBUTING.md)를 참고해 주세요.
