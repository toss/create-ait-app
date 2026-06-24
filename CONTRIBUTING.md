# 기여하기

create-ait-app CLI와 프로젝트 템플릿에 기여하는 방법을 정리한 문서예요.

## 저장소 구조

```
create-ait-app/
├── bin/
│   └── index.js          # CLI 진입점
├── src/
│   ├── main.js           # CLI 진입, 프롬프트 오케스트레이션
│   ├── cli.js            # 인자 파싱, 도움말
│   ├── templates.js      # 템플릿 레지스트리
│   ├── sample-configs.js # 샘플 주입 메타데이터
│   ├── sample-inject.js  # 앱 파일 플레이스홀더 치환
│   ├── scaffold.js       # 템플릿 복사, 의존성 설치, 포맷팅
│   ├── skills.js         # AI skills 파일 생성
│   └── utils/            # copy-dir, fetch-text, package-name
├── templates/            # 생성되는 프로젝트 템플릿 (각각 독립)
│   ├── react-ts/
│   ├── react/
│   ├── react-ts-tds/
│   ├── js/
│   └── ts/
└── package.json
```

## 템플릿 (`templates/`)

| 템플릿 | 설명 |
| --- | --- |
| `react-ts` | React + TypeScript (기본) |
| `react` | React + JavaScript |
| `js` | Vanilla JavaScript |
| `ts` | Vanilla TypeScript |

`react-ts` + `--tds` 선택 시 내부적으로 `templates/react-ts-tds/` 폴더를 사용해요.

각 템플릿은 완전히 격리된 폴더로 관리돼요.

### 템플릿 패키지 내부

```
templates/react-ts/
├── package.json
├── vite.config.ts
├── granite.config.ts
├── eslint.config.js
├── index.html
├── README.md             # 생성된 프로젝트용 ({{APP_NAME}} 등 플레이스홀더)
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   └── ...
└── samples/              # --sample 옵션으로 선택 시에만 복사
    ├── iap/
    │   └── src/
    └── iaa/
        └── src/
```

- `samples/`는 생성된 프로젝트에 그대로 포함되지 않아요. `src/scaffold.js`에서 선택한 샘플만 복사해요.
- 앱 진입 파일(`App.tsx`, `App.jsx`, `app.js` 등)에는 `{{SAMPLE_IMPORTS}}`, `{{SAMPLE_BUTTONS}}` 같은 플레이스홀더가 있어요. CLI가 예제 선택에 맞게 치환해요.

### 템플릿 선택

`--template <name>`으로 지정해요. 미지정 시 기본값은 `react-ts`예요. TDS는 `--tds` 옵션으로 켜요 (`react-ts`에서만 적용).

| 템플릿 | 설명 |
| --- | --- |
| `react-ts` | React + TypeScript (기본) |
| `react` | React + JavaScript |
| `js` | Vanilla JavaScript |
| `ts` | Vanilla TypeScript |

```bash
create-ait-app test-react-ts --inline --template react-ts --tds --pm npm
create-ait-app test-react --inline --template react --pm npm --sample iap
create-ait-app test-js --inline --template js --pm npm
```

## 로컬에서 CLI 테스트

```bash
npm install
npm link
create-ait-app test-project
npm unlink -g create-ait-app
```

생성 결과를 빠르게 확인하려면 `--inline` 옵션을 함께 쓰면 돼요.

```bash
create-ait-app test-react-ts --inline --pm npm
create-ait-app test-react --inline --template react --pm npm --sample iap
create-ait-app test-js --inline --template js --pm npm --sample iap
```

## 템플릿 수정 시

1. 해당 `templates/<템플릿>/` 폴더만 수정해요.
2. 다른 템플릿과 공유 코드를 맞추고 싶다면 각 폴더에 동일하게 반영해요. (의도적으로 중복을 허용하는 구조예요.)
3. `npm test`로 CLI 문법 검사를 실행해요.
4. `npm link` 후 실제 프로젝트를 생성해 동작을 확인해요.

## 예제 코드 추가

1. 각 템플릿의 `samples/<id>/src/` 아래에 파일을 추가해요. React 템플릿은 SDK 연동 로직을 `src/hooks/`, Vanilla(`js`/`ts`) 템플릿은 `src/lib/`에 둬요.
2. `src/sample-configs.js`의 해당 템플릿용 `*_SAMPLE_CONFIG`에 import, route, button 메타데이터를 등록해요.
3. 앱 진입 파일의 플레이스홀더와 맞는지 확인해요.

## `src/` 주요 흐름

1. `main.js` — CLI 인자·대화형 프롬프트로 옵션 수집
2. `templates.js` — `templates/` 하위 템플릿 결정
3. `scaffold.js` — 템플릿 복사 (`samples/` 제외), 플레이스홀더 치환, 샘플 복사·주입
4. `scaffold.js` — 의존성 설치, `@apps-in-toss/web-framework` 추가, 포맷팅
5. `skills.js` — (선택) AI skills 파일 생성

## npm publish

`package.json`의 `files` 필드에 `bin`, `src`, `templates`가 포함돼 있어요. 템플릿을 추가·변경했다면 publish 전에 생성 테스트를 꼭 해 주세요.

```bash
npm test
npm publish
```
