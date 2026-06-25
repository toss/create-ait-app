# create-ait-app

앱인토스(Apps in Toss) 프로젝트를 빠르게 시작할 수 있는 CLI 도구예요.
Vite 기반 **React** 또는 **Vanilla** 프로젝트를 생성하고, TDS·인앱결제·인앱광고 예제 등을 선택적으로 추가할 수 있어요.

**Node.js 24 이상**이 필요해요.

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
2. **프로젝트 템플릿** — `react-ts` / `react` / `js` / `ts`
3. **TDS (Toss Design System)** — `react-ts` 선택 시에만 표시돼요 (선택, 기본값: 사용 안 함)
4. **AI Skills** — Cursor / Claude Code / Codex용 SDK 문서 파일 추가 여부
5. **예제 코드** — 인앱결제(`iap`), 인앱광고(`iaa`) 샘플 추가 (복수 선택 가능)

## CLI 옵션

프롬프트 없이 한 줄로 생성할 수도 있어요.

```bash
create-ait-app my-app --inline --pm yarn --sample iap,iaa
```

| 옵션 | 설명 |
| --- | --- |
| `--inline` | 대화형 질문을 생략하고 옵션만으로 설정해요 (미지정 항목은 모두 `n`이에요) |
| `--pm <name>` | 패키지 매니저를 지정해요 (`npm`, `yarn`, `pnpm`) |
| `--template <name>` | 템플릿을 지정해요 (`js`, `ts`, `react`, `react-ts` / 기본값: `react-ts`) |
| `--tds` | `react-ts` 템플릿에서 TDS를 사용해요 (다른 템플릿에서는 무시돼요) |
| `--skills` | AI를 위한 Skills 파일을 추가해요 |
| `--ai <name>` | 사용할 AI 도구를 지정해요 (`cursor`, `claude`, `codex`) |
| `--sample <name>` | 예제 코드를 추가해요 (`iap`, `iaa` / 복수: `iap,iaa`) |
| `--help` | 도움말을 출력해요 |

### TDS (Toss Design System)

TDS는 토스에서 제공하는 디자인 시스템 컴포넌트 모음이에요. React를 필수로 사용해야 해요.

TDS 사용은 앱인토스 개발에 필수가 아니에요. `react-ts` 템플릿을 선택한 경우에만 `--tds` 옵션이나 대화형 프롬프트에서 TDS 사용 여부를 물어봐요.

## 생성되는 프로젝트

기본 템플릿은 헤더, 개발자센터·커뮤니티 링크 등 최소 구성만 포함해요. `--sample`로 예제를 선택한 경우 `src/pages/`가 추가되고, React 템플릿은 `src/hooks/`, Vanilla(`js`/`ts`) 템플릿은 `src/lib/`가 추가돼요.


## 관련 링크

- [앱인토스 콘솔](https://apps-in-toss.toss.im/)
- [앱인토스 개발자센터](https://developers-apps-in-toss.toss.im/)
- [앱인토스 개발자 커뮤니티](https://techchat-apps-in-toss.toss.im/)
- [AI를 위한 LLMs 문서](https://developers-apps-in-toss.toss.im/development/llms.html)

---

이 CLI 도구에 기여하고 싶다면 [CONTRIBUTING.md](./CONTRIBUTING.md)를 참고해 주세요.
