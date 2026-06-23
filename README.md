# create-ait-app

앱인토스(Apps in Toss) 프로젝트를 빠르게 시작할 수 있는 CLI 도구예요.
Vite 기반 **React** 또는 **Vanilla** 프로젝트를 생성하고, TDS·인앱결제·인앱광고 예제 등을 선택적으로 추가할 수 있어요.

## 빠르게 시작하기

```bash
npx create-ait-app my-app
cd my-app
npm run dev
```

패키지 매니저는 생성 시 선택한 값에 맞게 `yarn dev`, `pnpm dev` 등으로 실행하면 돼요.

## 대화형 설정

`npx create-ait-app`을 실행하면 아래 항목을 순서대로 선택할 수 있어요.

1. **패키지 매니저** — npm, yarn, pnpm
2. **프로젝트 템플릿** — React + TypeScript (기본) / React + JavaScript / Vanilla JavaScript / Vanilla TypeScript
3. **TDS (Toss Design System)** — React + TypeScript를 선택했을 때만 표시돼요 (선택, 기본값: 사용 안 함)
4. **AI Skills** — Cursor / Claude Code / Codex용 SDK 문서 파일 추가 여부
5. **예제 코드** — 인앱결제(`iap`), 인앱광고(`iaa`) 샘플 추가 (복수 선택 가능)

## CLI 옵션

프롬프트 없이 한 줄로 생성할 수도 있어요.

```bash
# React + TypeScript (기본)
create-ait-app my-app --inline --pm yarn --sample iap,iaa

# React + JavaScript
create-ait-app my-app --inline --javascript --pm yarn --sample iap

# Vanilla JavaScript
create-ait-app my-app --inline --vanilla --pm yarn --sample iap

# Vanilla TypeScript
create-ait-app my-app --inline --vanilla --typescript --pm yarn

# React + TDS + AI Skills
create-ait-app my-app --inline --pm yarn --tds --skills --ai cursor --sample iap,iaa
```

| 옵션 | 설명 |
| --- | --- |
| `--inline` | 대화형 질문을 생략하고 옵션만으로 설정해요 (미지정 항목은 모두 `n`이에요) |
| `--pm <name>` | 패키지 매니저를 지정해요 (`npm`, `yarn`, `pnpm`) |
| `--vanilla` | Vanilla 템플릿을 사용해요 (기본값: React + TypeScript) |
| `--javascript` | React + JavaScript 템플릿을 사용해요 |
| `--typescript` | Vanilla 템플릿에서 TypeScript를 사용해요 (`--vanilla`와 함께) |
| `--tds` | TDS 패키지를 포함한 React + TypeScript 템플릿을 사용해요 |
| `--skills` | AI Skills 파일을 추가해요 |
| `--ai <name>` | AI 도구를 지정해요 (`cursor`, `claude`, `codex`) |
| `--sample <name>` | 예제 코드를 추가해요 (`iap`, `iaa` / 복수: `iap,iaa`) |
| `--help` | 도움말을 출력해요 |

### TDS (Toss Design System)

TDS는 토스에서 제공하는 디자인 시스템 컴포넌트 모음이에요. React를 필수로 사용해야 해요.

TDS 사용은 앱인토스 개발에 필수가 아니며, CLI 기본값은 **사용 안 함**이에요. 필요할 때만 `--tds` 옵션이나 대화형 프롬프트에서 선택하면 돼요. Vanilla 템플릿과는 함께 사용할 수 없어요.

## 생성되는 프로젝트

기본 템플릿은 헤더, 개발자센터·커뮤니티 링크 등 최소 구성만 포함해요. `--sample`로 예제를 선택한 경우에만 `src/hooks/`, `src/pages/`가 추가돼요.

### React + TypeScript

```
my-app/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── hooks/           # --sample 선택 시
│   └── pages/           # --sample 선택 시
├── granite.config.ts
├── package.json
└── vite.config.ts
```

### React + JavaScript

```
my-app/
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   ├── hooks/           # --sample 선택 시
│   └── pages/           # --sample 선택 시
├── granite.config.ts
├── package.json
└── vite.config.js
```

### Vanilla

```
my-app/
├── src/
│   ├── app.js 또는 app.ts
│   ├── main.js 또는 main.ts
│   ├── hooks/           # --sample 선택 시
│   └── pages/           # --sample 선택 시
├── granite.config.ts
├── package.json
└── vite.config.js 또는 vite.config.ts
```

## 관련 링크

- [앱인토스 콘솔](https://apps-in-toss.toss.im/)
- [앱인토스 개발자센터](https://developers-apps-in-toss.toss.im/)
- [앱인토스 개발자 커뮤니티](https://techchat-apps-in-toss.toss.im/)
- [AI를 위한 LLMs 문서](https://developers-apps-in-toss.toss.im/development/llms.html)

---

이 CLI 도구에 기여하고 싶다면 [CONTRIBUTING.md](./CONTRIBUTING.md)를 참고해 주세요.
