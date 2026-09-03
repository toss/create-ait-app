# create-ait-app

[![npm version](https://img.shields.io/npm/v/create-ait-app.svg)](https://www.npmjs.com/package/create-ait-app)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](./LICENSE)
[![CI](https://github.com/toss/create-ait-app/actions/workflows/ci.yml/badge.svg)](https://github.com/toss/create-ait-app/actions/workflows/ci.yml)

Apps in Toss 웹앱을 시작할 수 있도록 Vite 프로젝트를 만들고 필요한 설정을 추가해 주는 CLI예요.

명령 한 줄이면 Vite 프로젝트를 만들고 Apps in Toss 설정과 의존성 설치까지 끝나요. 번들러 플러그인도 함께 연결해요. 만들어진 프로젝트에서 `dev`와 `build`, `deploy` 명령을 바로 실행할 수 있어요.

Node.js 24 이상이 필요해요.

## 프로젝트 만들기

```bash
npx create-ait-app my-app
```

`git init`을 먼저 실행했거나 빈 저장소를 clone했다면 현재 디렉터리에도 만들 수 있어요. `.git` 외에 다른 파일이 있으면 기존 파일을 보호하기 위해 생성을 중단해요.

```bash
npx create-ait-app .
```

실행한 패키지 매니저를 감지해 프로젝트에도 그대로 사용해요. `npx`로 실행하면 npm이 되고 `yarn create`는 Yarn, `pnpm create`는 pnpm이 돼요.

감지에 성공하면 패키지 매니저를 따로 묻지 않아요. 다른 패키지 매니저를 쓰고 싶다면 해당 패키지 매니저로 실행하거나 `--pm`으로 지정해 주세요.

```bash
# Yarn으로 만들기
yarn create ait-app my-app

# pnpm으로 만들기
pnpm create ait-app my-app

# npx로 실행하되 pnpm 프로젝트로 만들기
npx create-ait-app my-app --pm pnpm
```

이어서 순서대로 필요한 선택지를 물어봐요.

1. 패키지 매니저를 골라요. 감지에 성공하면 이 단계를 건너뛰어요.
2. Vite 프리셋을 골라요.
3. 예제 코드를 골라요. 지원되는 프로젝트에서만 물어봐요.

선택이 끝나면 Apps in Toss 설정과 의존성을 준비해요. 그다음 설치된 웹 프레임워크의 `ait init`을 실행해서 devtools 설치와 번들러 플러그인 설정까지 마쳐요.

## 개발 시작하기

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

앱 이름과 브랜드, 권한 설정은 `apps-in-toss.config.ts`에서 바꿀 수 있어요. `build`가 성공하면 배포할 수 있는 `.ait` 파일이 생성돼요.

## 프레임워크 선택하기

Vite가 제공하는 정적 클라이언트 프리셋을 선택할 수 있어요. React와 Vue, Svelte, Solid, Preact, Lit, Qwik, Vanilla와 각 TypeScript 변형을 지원해요.

순수 CSR(Client-Side Rendering)을 지원해요. 빌드할 때 HTML을 만든 뒤 클라이언트에서 하이드레이션하는 SSG(Static Site Generation)도 지원해요. 요청마다 서버 런타임이 필요한 SSR(Server-Side Rendering) 전용 프로젝트는 지원하지 않아요.

이전 이름과의 호환을 위해 `js`는 `vanilla`로 `ts`는 `vanilla-ts`로 해석해요.

### TDS 사용하기

TDS(Toss Design System)는 React 18이 필요하므로 `--tds`로 전용 프로젝트를 만들어 주세요. 대화형 실행에서는 TDS 사용 여부를 묻지 않아요.

```bash
npx create-ait-app my-app --inline --pm npm --tds
```

TDS에서는 프리셋이 자동으로 결정되므로 `--template`은 생략해 주세요.

## 예제 코드 사용하기

인앱 결제(IAP)와 인앱 광고(IAA) 예제를 프로젝트에 추가할 수 있어요. React와 React TypeScript, Vanilla, Vanilla TypeScript, TDS 프로젝트에서 지원해요.

프로젝트를 만들 때 바로 추가하려면 `--sample`을 사용해 주세요.

```bash
npx create-ait-app my-app --inline --pm npm --template react-ts --sample iap,iaa
```

이미 만든 프로젝트에 나중에 추가할 수도 있어요. 예제를 지정하지 않으면 아직 추가하지 않은 예제를 대화형으로 골라요.

```bash
# 현재 프로젝트에 대화형으로 추가
npx create-ait-app add-sample

# 경로와 예제를 직접 지정
npx create-ait-app add-sample ./my-app --sample iap,iaa
```

`add-sample`은 create-ait-app으로 만든 지원 프로젝트만 수정해요. 이미 추가된 예제는 건너뛰고 새 예제만 더해요.

첫 예제를 나중에 추가할 때 Vite의 `App` 또는 `main` 진입 파일이 이미 수정되어 있으면 사용자 코드를 덮어쓰지 않고 중단해요. 예제 셸이 생성된 뒤에는 관리 주석 바깥의 사용자 코드를 유지하면서 새 예제만 추가해요.

## 프롬프트 없이 만들기

CI나 스크립트에서 사용한다면 `--inline`과 필요한 옵션을 함께 지정해 주세요.

```bash
# React + TypeScript
npx create-ait-app my-app --inline --pm npm --template react-ts

# Vue + TypeScript
npx create-ait-app my-app --inline --pm yarn --template vue-ts

# React 18 + TDS, 인앱 결제와 인앱 광고 예제
npx create-ait-app my-app \
  --inline \
  --pm yarn \
  --tds \
  --sample iap,iaa
```

`--inline`은 필요한 값을 추측하지 않아요. 프로젝트 경로와 `--pm`이 있어야 하고 `--template` 또는 `--tds` 중 하나가 빠지면 도움말을 확인하라는 오류로 종료해요.

Apps in Toss 시작 화면을 만들어요.

## 에이전트에게 프로젝트 생성 맡기기

아래 프롬프트를 에이전트에게 전달하면 필요한 선택을 먼저 확인한 뒤 프로젝트 생성까지 비대화형으로 완료해요.

```text
`npx --yes create-ait-app --help`를 먼저 실행해 주세요.

도움말을 기준으로 프로젝트 경로와 패키지 매니저, 프로젝트 유형과 프리셋, 예제 코드를 선택지와 결과가 보이도록 저에게 물어봐 주세요.

제 답을 받으면 프로젝트 경로와 `--inline`, `--pm`을 반드시 포함해 주세요. `--template` 또는 `--tds` 중 하나를 넣고 선택한 `--sample`을 추가해 전체 명령을 비대화형으로 끝까지 실행해 주세요.
```

에이전트는 예를 들어 다음 내용을 물어봐요.

1. 프로젝트를 만들 경로를 물어봐요.
2. 기본값인 일반 Vite 프로젝트를 안내하고 `--help`에 나온 프리셋 중 하나를 물어봐요.
3. 사용자가 TDS를 원할 때만 도움말의 권장사항을 안내하고 TDS 사용 여부를 물어봐요.
4. npm과 Yarn, pnpm 중 사용할 패키지 매니저를 물어봐요.
5. 지원되는 프로젝트라면 인앱 결제와 인앱 광고 예제를 추가할지 물어봐요.

## CLI 옵션

명령에 지정할 수 있는 옵션은 다음과 같아요.

| 옵션                | 설명                                                                           |
| ------------------- | ------------------------------------------------------------------------------ |
| `--inline`          | 모든 질문을 생략해요. 프로젝트 경로와 필수 옵션을 함께 써야 해요.              |
| `--list-templates`  | 지원하는 프로젝트 프리셋을 JSON으로 출력해요.                                  |
| `--pm <name>`       | 패키지 매니저를 지정해요. `npm`과 `yarn`, `pnpm`을 지원해요.                   |
| `--template <name>` | Vite 프리셋을 지정해요. `vue-ts`나 `svelte`처럼 써요.                          |
| `--tds`             | React 18과 TypeScript, TDS를 쓰는 프로젝트를 만들어요. 대화형으로 묻지 않아요. |
| `--sample <name>`   | `iap`와 `iaa` 예제를 추가해요. 쉼표로 여러 개를 지정할 수 있어요.              |
| `--version`, `-v`   | 설치된 버전을 출력해요.                                                        |
| `--help`            | 도움말을 출력해요.                                                             |

## 관련 링크

- [Apps in Toss 콘솔](https://apps-in-toss.toss.im/)
- [Apps in Toss 개발자센터](https://developers-apps-in-toss.toss.im/)
- [Apps in Toss 개발자 커뮤니티](https://techchat-apps-in-toss.toss.im/)

프로젝트 구조와 기여 방법은 [CONTRIBUTING.md](./.github/CONTRIBUTING.md)를 참고해 주세요.
