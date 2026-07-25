# 기여하기

create-ait-app에 기여해 주셔서 감사해요. Node.js 24 이상과 Corepack이 필요해요.

## 개발 환경

이 저장소는 Yarn 4 Plug'n'Play를 사용해요.

```bash
corepack enable
yarn install --immutable
```

VS Code에서는 저장소에 포함된 Yarn TypeScript SDK와 ZipFS 확장 권장을 사용해요.
워크스페이스를 연 뒤 TypeScript 버전 선택에서 `Use Workspace Version`을 선택하면
PnP 의존성 타입을 정상적으로 탐색할 수 있어요.

개발 중 CLI를 실행하려면 먼저 빌드하세요.

```bash
yarn build
yarn exec create-ait-app test-project --inline --template react-ts --pm npm
```

## 품질 검사

PR을 열기 전에 전체 검사를 실행해 주세요.

```bash
yarn check
```

이 명령은 oxfmt 포맷, oxlint, TypeScript 타입 검사, Vitest 단위 테스트, tsdown 빌드,
publint를 순서대로 확인해요. 포맷을 적용하려면 `yarn format`을 사용하세요.

생성 결과의 실제 설치·빌드·정적 HTML·개발 서버를 확인하려면 스캐폴딩 테스트를
실행해요.

```bash
yarn test:e2e
AIT_E2E_TEMPLATES=all yarn test:e2e
```

기본값은 `react-ts`이고, `all`은 고정된 `create-vite` 패키지에서 프리셋을 동적으로
읽어 SSR 전용 빌드만 제외한 모든 프리셋과 TDS 템플릿을 검사해요. 순수 CSR과
SSG+hydration은 모두 대상이에요.

## 구조와 변경 원칙

- CLI 구현은 `src/*.ts`에 두고 `tsdown.config.ts`에서 공개 export와 bin을 생성해요.
- `dist/`와 `package.json`의 export/bin 경로는 tsdown의 `exports: true`가 관리해요.
- 일반 정적 클라이언트 앱의 뼈대는 `create-vite`가 유일한 원본이에요. 저장소에
  프레임워크별 전체 템플릿을 복제하지 마세요.
- `templates/react-ts-tds/`는 React 18이 필요한 TDS 전용 예외예요.
- 선택형 예제 조각은 `assets/samples/`에 두고, 지원되는 React/Vanilla 계열에만
  적용해요.
- Agent Skills는 `assets/skills/`에 vercel-labs/skills 형식으로 관리해요. 공식
  문서 본문을 저장소에 복사하지 말고 동적 문서 조회 절차만 유지하세요.

## create-vite 업데이트

`create-vite`는 `package.json`에 정확한 버전으로 고정해요. 수동으로 올릴 때는
다음 검증을 모두 통과해야 해요.

```bash
yarn up create-vite@<version>
yarn check
AIT_E2E_TEMPLATES=all yarn test:e2e
```

`.github/workflows/update-create-vite.yml`도 매일 같은 절차를 실행하고, 성공했을 때만
버전 업데이트 PR을 만들어요.

## Pull Request

1. `main`에서 작업 브랜치를 만들어요.
2. 구현과 직접 영향받는 문서를 함께 수정해요.
3. `yarn check`와 필요한 스캐폴딩 테스트 결과를 확인해요.
4. [PR 템플릿](.github/PULL_REQUEST_TEMPLATE.md)에 맞춰 PR을 작성해요.

`package.json`의 create-ait-app 버전은 메인테이너가 관리하므로 일반 PR에서는 올리지
않아도 돼요. 커밋 메시지는 Conventional Commits 형식을 권장해요.

```text
feat: 모든 Vite 정적 클라이언트 프리셋 지원
fix: 생성 프로젝트의 SSR 전용 빌드 판별 보완
docs: create-vite 업데이트 정책 설명
```

버그를 제보할 때는 기대한 동작, 실제 동작, 재현 명령, OS와 Node.js 버전, 오류
메시지를 함께 남겨 주세요.
