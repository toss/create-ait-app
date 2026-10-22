# create-ait-app

[![npm version](https://img.shields.io/npm/v/create-ait-app.svg)](https://www.npmjs.com/package/create-ait-app)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](./LICENSE)
[![CI](https://github.com/toss/create-ait-app/actions/workflows/ci.yml/badge.svg)](https://github.com/toss/create-ait-app/actions/workflows/ci.yml)

Apps in Toss 웹앱을 Vite로 바로 시작하게 해 주는 CLI예요. 명령 한 줄이면 설정을 따로 만지지 않아도 개발 서버를 띄우고, 빌드하고, 배포할 수 있는 프로젝트가 생겨요.

## 시작하기

Node.js 24 이상이 필요해요.

```bash
npx create-ait-app my-app
```

패키지 매니저, 프레임워크, 넣을 예제 코드를 차례로 고르면 프로젝트가 만들어져요. 다 만들어지면 개발 서버를 띄워 보세요.

```bash
cd my-app
npm run dev
```

## 만든 프로젝트로 할 수 있는 것

Apps in Toss 시작 화면, `apps-in-toss.config.ts`, devtools, 번들러 플러그인이 모두 준비된 상태라 바로 개발을 시작하면 돼요.

```bash
npm run dev     # 개발 서버 실행
npm run build   # 배포할 .ait 파일 만들기
npm run deploy  # 배포
```

Yarn이나 pnpm을 골랐다면 `npm run` 대신 그 패키지 매니저로 실행하세요. 앱 이름, 브랜드, 권한은 `apps-in-toss.config.ts`에서 바꿔요.

만드는 도중 Apps in Toss 설정 단계가 실패해도 그때까지 만든 파일은 남아 있어요. 화면에 나오는 명령을 직접 실행하면 이어서 설정할 수 있어요.

## 원하는 환경으로 만들기

### 다른 패키지 매니저 쓰기

실행한 패키지 매니저가 그대로 프로젝트에 쓰여요. `npx`로 실행하면 npm, `yarn create`면 Yarn, `pnpm create`면 pnpm이에요. 이때는 패키지 매니저를 따로 묻지 않아요.

```bash
# Yarn으로 만들기
yarn create ait-app my-app

# pnpm으로 만들기
pnpm create ait-app my-app

# npx로 실행하되 pnpm 프로젝트로 만들기
npx create-ait-app my-app --pm pnpm
```

### 지금 있는 폴더에 만들기

`git init`만 했거나 빈 저장소를 막 clone했다면 그 폴더에 바로 만들 수 있어요. 프로젝트 이름은 폴더 이름을 따라요.

```bash
npx create-ait-app .
```

폴더에 `.git` 말고 다른 파일이 있으면 기존 파일을 지키려고 만들지 않고 멈춰요. 경로를 직접 지정했을 때도 같아요.

### 프레임워크 고르기

아래 프레임워크 중에서 고를 수 있어요. 질문에 답하는 대신 `--template`에 템플릿 이름을 넘겨도 돼요.

| 프레임워크 | JavaScript | TypeScript   |
| ---------- | ---------- | ------------ |
| React      | `react`    | `react-ts`   |
| Vue        | `vue`      | `vue-ts`     |
| Svelte     | `svelte`   | `svelte-ts`  |
| Solid      | `solid`    | `solid-ts`   |
| Preact     | `preact`   | `preact-ts`  |
| Lit        | `lit`      | `lit-ts`     |
| Qwik       | `qwik`     | `qwik-ts`    |
| Vanilla    | `vanilla`  | `vanilla-ts` |

```bash
npx create-ait-app my-app --template vue-ts
```

TDS를 쓰려면 템플릿 대신 `--tds`를 사용해요([TDS로 만들기](#tds로-만들기) 참고). 지금 설치된 버전에서 쓸 수 있는 목록은 `--list-templates`로도 확인할 수 있어요.

브라우저에서 렌더링하는 CSR 방식과 빌드할 때 HTML을 미리 만들어 두는 SSG 방식을 쓸 수 있어요. 요청마다 서버가 HTML을 만드는 SSR 방식은 지원하지 않아요.

예전 이름인 `js`와 `ts`를 넘기면 각각 `vanilla`, `vanilla-ts`로 만들어져요.

### TDS로 만들기

TDS(Toss Design System)를 쓰려면 `--tds`를 사용하세요. TDS에 맞춰 React 18과 TypeScript로 구성된 프로젝트가 만들어져요. 질문 중에는 TDS를 고르는 단계가 없으니 꼭 이 옵션으로 만들어야 해요.

```bash
npx create-ait-app my-app --tds
```

프레임워크가 정해져 있어서 `--template`과 함께 쓸 수는 없어요.

## 인앱 결제·광고 예제로 바로 사용해 보기

인앱 결제(`iap`)나 인앱 광고(`iaa`)를 붙여 보고 싶다면 예제 코드를 넣어 시작할 수 있어요. React, React TypeScript, Vanilla, Vanilla TypeScript, TDS 프로젝트에서 쓸 수 있어요.

프로젝트를 만들 때 질문에서 고르거나 `--sample`로 지정하세요.

```bash
npx create-ait-app my-app --template react-ts --sample iap,iaa
```

이미 만든 프로젝트에는 `add-sample`로 나중에 넣어요. 프로젝트 폴더에서 실행하면 아직 넣지 않은 예제 중에서 고를 수 있어요.

```bash
# 지금 있는 프로젝트에 골라서 넣기
npx create-ait-app add-sample

# 경로와 예제를 직접 지정
npx create-ait-app add-sample ./my-app --sample iap,iaa
```

이미 넣은 예제는 건너뛰고, 직접 작성한 코드는 덮어쓰지 않아요. 다만 `App`이나 `main` 파일을 처음 만든 상태에서 고친 뒤 첫 예제를 넣으려 하면, 코드를 지키려고 넣지 않고 멈춰요.

## 질문 없이 만들기

만들 구성이 이미 정해져 있다면 `--inline`을 사용하세요. 질문 없이 명령 한 줄로 프로젝트를 만들어요. 같은 구성으로 프로젝트를 여러 번 만드는 스크립트나 CI, 터미널 질문에 답할 수 없는 [코딩 에이전트](#코딩-에이전트에게-맡기기)에게 생성을 맡길 때 쓰기 좋아요.

`--inline`을 쓸 때는 프로젝트 경로, `--pm`, 그리고 `--template`과 `--tds` 중 하나를 꼭 넘겨야 해요. 빠진 값이 있으면 오류를 알리고 멈춰요.

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

### 코딩 에이전트에게 맡기기

아래 프롬프트를 코딩 에이전트에게 주면 에이전트가 프로젝트 경로, 프레임워크와 TDS 사용 여부, 패키지 매니저, 예제 코드를 물어본 뒤 답에 맞춰 프로젝트를 만들어 줘요.

```text
`npx --yes create-ait-app --help`를 먼저 실행해 주세요.

도움말을 기준으로 프로젝트 경로, 패키지 매니저, 프로젝트 유형과 프리셋, 예제 코드를 저에게 물어봐 주세요. 각 항목의 선택지와 선택했을 때의 결과도 함께 알려 주세요.

제 답을 받으면 프로젝트 경로, `--inline`, `--pm`을 명령에 반드시 포함해 주세요. `--template` 또는 `--tds` 중 하나를 넣고, 예제를 선택했다면 `--sample`도 추가해 명령을 비대화형으로 끝까지 실행해 주세요.
```

## CLI 옵션

```text
create-ait-app [directory] [options]
create-ait-app add-sample [directory] [options]
```

| 옵션                | 설명                                                              |
| ------------------- | ----------------------------------------------------------------- |
| `--inline`          | 질문 없이 만들어요. 프로젝트 경로와 필수 옵션을 함께 넘겨야 해요. |
| `--list-templates`  | 고를 수 있는 프레임워크 템플릿을 JSON으로 보여 줘요.              |
| `--pm <name>`       | 패키지 매니저를 정해요. `npm`, `yarn`, `pnpm` 중 하나예요.        |
| `--template <name>` | 프레임워크 템플릿을 정해요. `vue-ts`, `svelte`처럼 써요.          |
| `--tds`             | React 18, TypeScript, TDS로 구성된 프로젝트를 만들어요.           |
| `--sample <name>`   | `iap`, `iaa` 예제를 넣어요. 여러 개는 쉼표로 구분해요.            |
| `--version`, `-v`   | 설치된 버전을 보여 줘요.                                          |
| `--help`            | 도움말을 보여 줘요.                                               |

## 관련 링크

- [Apps in Toss 콘솔](https://apps-in-toss.toss.im/)
- [Apps in Toss 개발자센터](https://developers-apps-in-toss.toss.im/)
- [Apps in Toss 개발자 커뮤니티](https://techchat-apps-in-toss.toss.im/)

프로젝트 구조와 기여 방법은 [CONTRIBUTING.md](./.github/CONTRIBUTING.md)를 참고해 주세요.
