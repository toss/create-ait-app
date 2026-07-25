# create-ait-app

Apps in Toss 웹앱을 시작할 수 있도록 Vite 프로젝트를 만들고 필요한 설정을 추가해
주는 CLI예요.

Node.js 24 이상이 필요해요.

## 1. 프로젝트 만들기

```bash
npx create-ait-app my-app
```

대화형 실행에서는 순서대로 필요한 선택지를 물어봐요.

1. 실행한 패키지 매니저를 감지해 사용하고, 감지할 수 없으면 직접 골라요.
2. TDS를 사용할지 선택해요.
3. TDS를 사용하지 않는다면 Vite 프리셋을 골라요.
4. 지원되는 프로젝트에서는 IAP·IAA 예제 코드를 추가할 수 있어요.
5. Cursor·Claude Code·Codex용 Agent Skills를 추가할 수 있어요.

선택이 끝나면 Apps in Toss 설정과 의존성을 준비해요.

## 2. 개발 시작하기

```bash
cd my-app
npm run dev
```

생성한 프로젝트에서는 다음 명령을 사용할 수 있어요.

```bash
npm run dev
npm run build
npm run deploy
```

Yarn이나 pnpm을 선택했다면 `npm run` 대신 해당 패키지 매니저를 사용해 주세요.
앱 이름, 브랜드, 권한과 개발 서버 설정은 `granite.config.ts`에서 바꿀 수 있어요.
`build`가 성공하면 배포할 수 있는 `.ait` 파일이 생성돼요.

## 프롬프트 없이 만들기

CI나 스크립트에서 사용한다면 `--inline`과 필요한 옵션을 함께 지정해 주세요.

```bash
# React + TypeScript
npx create-ait-app my-app --inline --pm npm --template react-ts

# Vue + TypeScript
npx create-ait-app my-app --inline --pm yarn --template vue-ts

# React 18 + TDS, IAP·IAA 예제, Codex Skills
npx create-ait-app my-app \
  --inline \
  --pm yarn \
  --tds \
  --sample iap,iaa \
  --skills \
  --ai codex
```

`--inline`에서 프리셋을 생략하면 `react-ts`를 사용해요.

## 프레임워크 선택하기

React, Vue, Svelte, Solid, Preact, Lit, Qwik, Vanilla와 각 TypeScript 변형처럼 Vite가
제공하는 정적 클라이언트 프리셋을 선택할 수 있어요.

순수 CSR과 빌드 시 HTML을 생성한 뒤 클라이언트에서 hydration하는 SSG를 지원해요.
요청마다 서버 런타임이 필요한 SSR 전용 프로젝트는 지원하지 않아요.

이전 이름과의 호환을 위해 `js`는 `vanilla`, `ts`는 `vanilla-ts`로 해석해요.

### TDS 사용하기

TDS는 React 18이 필요하므로 `--tds`로 전용 프로젝트를 만들어 주세요.

```bash
npx create-ait-app my-app --inline --tds
```

TDS에서는 프리셋이 자동으로 결정되므로 `--template`은 생략해 주세요.

## 예제 코드 사용하기

IAP·IAA 예제는 React, React TypeScript, Vanilla, Vanilla TypeScript, TDS 프로젝트에
추가할 수 있어요.

프로젝트를 만들 때 바로 추가하려면 `--sample`을 사용해 주세요.

```bash
npx create-ait-app my-app --inline --sample iap,iaa
```

이미 만든 프로젝트에 나중에 추가할 수도 있어요. 예제를 지정하지 않으면 아직
추가하지 않은 예제를 대화형으로 골라요.

```bash
# 현재 프로젝트에 대화형으로 추가
npx create-ait-app add-sample

# 경로와 예제를 직접 지정
npx create-ait-app add-sample ./my-app --sample iap,iaa
```

`add-sample`은 create-ait-app으로 만든 지원 프로젝트만 수정해요. 이미 추가된 예제는
건너뛰고 새 예제만 더해요.

## Agent Skills 사용하기

프로젝트를 만들 때 사용 중인 AI 도구를 선택하면 필요한 Skills를 함께 설치해요.

- Skills를 선택한 일반 프로젝트에는 `apps-in-toss`를 설치해요.
- Skills를 선택한 TDS 프로젝트에는 `apps-in-toss`와 `tds-mobile`을 설치해요.

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
문서를 우선 확인하고, 더 넓은 문맥이 필요할 때는 `llms-full.txt`를 검색해요.

## CLI 옵션

| 옵션                | 설명                                                             |
| ------------------- | ---------------------------------------------------------------- |
| `--inline`          | 대화형 질문을 생략해요. 기본 프리셋은 `react-ts`예요.            |
| `--pm <name>`       | 패키지 매니저를 지정해요. `npm`, `yarn`, `pnpm`을 지원해요.      |
| `--template <name>` | Vite 프리셋을 지정해요. 예: `vue-ts`, `svelte`, `solid-ts`       |
| `--tds`             | React 18 + TypeScript + TDS 프로젝트를 만들어요.                 |
| `--sample <name>`   | `iap`, `iaa` 예제를 추가해요. 쉼표로 여러 개를 지정할 수 있어요. |
| `--skills`          | 최신 공식 문서를 조회하는 Agent Skills를 추가해요.               |
| `--ai <name>`       | Skills 대상 도구를 지정해요. `cursor`, `claude`, `codex`         |
| `--skip-install`    | 프로젝트 생성 뒤 의존성 설치를 생략해요.                         |
| `--help`            | 도움말을 출력해요.                                               |

## 관련 링크

- [Apps in Toss 콘솔](https://apps-in-toss.toss.im/)
- [Apps in Toss 개발자센터](https://developers-apps-in-toss.toss.im/)
- [Apps in Toss 개발자 커뮤니티](https://techchat-apps-in-toss.toss.im/)

프로젝트 구조와 기여 방법은 [CONTRIBUTING.md](./CONTRIBUTING.md)를 참고해 주세요.
