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

개발 중 CLI를 실행하려면 먼저 빌드해 주세요.

```bash
yarn build
yarn exec create-ait-app test-project --inline --template react-ts --pm npm
```

## 품질 검사

PR을 열기 전에 전체 검사를 실행해 주세요.

```bash
yarn format:check
yarn lint
yarn typecheck
yarn test
yarn build
yarn publint
```

CI에서는 각 검사를 병렬로 실행해요. 포맷을 적용하려면 `yarn format`을 사용해
주세요.

생성 결과의 실제 설치·빌드·정적 HTML·`.ait` 산출물·개발 서버를 확인하려면
스캐폴딩 테스트를 실행해요.

```bash
yarn test:e2e
AIT_E2E_TEMPLATES=all yarn test:e2e
```

기본값은 `react-ts`이고, `all`은 고정된 `create-vite` 패키지에서 프리셋을 동적으로
읽어 SSR 전용 빌드만 제외한 모든 프리셋과 TDS 템플릿을 검사해요. 순수 CSR과
SSG+hydration은 모두 대상이에요.

## 구조와 변경 원칙

- `src/index.ts`는 `src/cli.ts`만 불러오는 실행 진입점이에요. 내부 모듈을 공개 API로
  재노출하지 않아요.
- 내부 의존성은 `system → project/package-manager/vite/samples/skills → scaffold → cli`
  방향으로만 이어져요. 상위 계층에서 하위 계층을 역참조하지 마세요.
- 공용 `types.ts`를 만들지 않아요. `PackageJson`, `SampleId`, `PackageManager`,
  `BaseProject` 같은 타입은 해당 책임을 구현하는 모듈에 함께 둬요.
- `tsdown.config.ts`에서 공개 export를 생성해요.
- `dist/`와 `package.json`의 export 경로는 tsdown이 관리하고, bin 경로는
  `package.json`에서 관리해요.
- 일반 정적 클라이언트 앱의 뼈대는 `create-vite`가 유일한 원본이에요. 저장소에
  프레임워크별 전체 템플릿을 복제하지 마세요.
- create-vite 실행 뒤 루트 `index.html`, Vite 의존성, `dev`·`build` 스크립트를
  확인해요. Vite SSR 번들만 만드는 `build`는 거부해요.
- 원래 Vite 스크립트는 생성 프로젝트의 `dev:vite`, `build:vite`로도 보존해요.
  `build`는 Vite 빌드 뒤 `ait build`를 실행하고, `deploy`는 `ait deploy`를 실행해요.
- 생성 프로젝트의 `@apps-in-toss/web-framework` 버전은
  `src/apps-in-toss/version-policy.ts`의 `APPS_IN_TOSS_WEB_FRAMEWORK_VERSION`만 SSoT로
  사용해요. `beta`, `rc`, `latest` 사이에서 전환할 때는 이 값 하나만 바꿔요.
- `templates/projects/react-ts-tds/`는 React 18이 필요한 TDS 전용 예외예요.
- 생성 결과에 복사하는 파일 원본은 `templates/`에서 관리해요. 완성형 프로젝트 뼈대는
  `templates/projects/`, 선택형 예제 조각은 `templates/samples/`에 두고 지원되는
  React/Vanilla 계열에만 적용해요.
- Agent Skills는 루트 `skills/`에 vercel-labs/skills 형식으로 관리해요.
- `npx skills add . --list`로 두 스킬을 찾을 수 있어야 해요.
- 생성 프로젝트에는 `package.json`에 고정된 `skills` CLI와 `--copy`로 설치해
  스캐폴더 패키지 경로를 가리키는 심볼릭 링크가 남지 않게 해요.
- 지원 에이전트 목록을 스캐폴더에 고정하지 않아요. 대상 에이전트 감지와 표준 설치
  경로 선택은 vercel-labs/skills CLI에 맡겨요.
- `--inline`은 프로젝트 경로, `--pm`, `--template` 또는 `--tds`가 모두 있을 때만
  실행해요. 필수값이 빠졌을 때 대화형 프롬프트로 넘어가지 말고 즉시 오류를 내야 해요.
- 공식 문서 본문을 저장소에 복사하지 말고 동적 문서 조회 절차만 유지해 주세요.

## create-vite 업데이트

`create-vite`는 `package.json`에 정확한 버전으로 고정해요. 수동으로 올릴 때는
다음 검증을 모두 통과해야 해요.

```bash
yarn up create-vite@<version>
yarn format:check
yarn lint
yarn typecheck
yarn test
yarn build
yarn publint
AIT_E2E_TEMPLATES=all yarn test:e2e
```

Dependabot은 매일 오전 9시(KST)에 create-vite 새 버전을 확인해요. create-vite는
기본 업데이트 대기 기간을 적용하지 않고, 새 버전이 있으면 `package.json`과
`yarn.lock`을 업데이트하는 PR을 만들어요.

Dependabot PR에서도 일반 PR과 같은 `.github/workflows/ci.yml`이 실행돼요. 포맷·린트·
타입 검사·단위 테스트·패키지 빌드와 동적으로 찾은 모든 정적 클라이언트 프리셋 및
TDS 스캐폴딩 테스트가 성공한 뒤에만 병합해 주세요.

## Pull Request

1. `main`에서 작업 브랜치를 만들어요.
2. 구현과 직접 영향받는 문서를 함께 수정해요.
3. 포맷·린트·타입 검사·단위 테스트·패키지 빌드와 필요한 스캐폴딩 테스트 결과를
   확인해요.
4. [PR 템플릿](.github/PULL_REQUEST_TEMPLATE.md)에 맞춰 PR을 작성해요.

`package.json`의 create-ait-app 버전은 메인테이너가 관리하므로 일반 PR에서는 올리지
않아도 돼요. 커밋 메시지는 Conventional Commits 형식을 권장해요.

```text
feat: 모든 Vite 정적 클라이언트 프리셋 지원
fix: 생성 프로젝트의 SSR 전용 빌드 판별 보완
docs: create-vite 업데이트 정책 설명
```

## 릴리스

릴리스는 최신 `main` 브랜치의 깨끗한 작업 트리에서 진행해요. `release-it`이 버전을
올리고 `chore: release v<version>` 커밋과 Git 태그를 push하면 GitHub Actions가 품질
검사를 거쳐 npm과 GitHub Release에 배포해요.

안정 버전은 다음 명령으로 만들어요.

```bash
yarn release-it
```

첫 beta는 올릴 버전 종류를 함께 지정해요. 이후 beta에서는 같은 명령을 다시 실행하면
`beta` 번호가 올라가요. 검증이 끝나면 RC로 전환하고, RC 검증까지 끝나면 안정 버전을
배포해요.

```bash
yarn release-it major --preRelease=beta
yarn release-it --preRelease=beta
yarn release-it --preRelease=rc
yarn release-it
```

beta와 RC는 각각 npm의 `beta`, `rc` dist-tag로 배포해요. 안정 버전은 `latest`로
배포해요.

```bash
npm install create-ait-app@beta
npm install create-ait-app@rc
npm install create-ait-app@latest
```

`alpha`처럼 정책에 없는 prerelease 채널은 배포 워크플로에서 거부해요.

버그를 제보할 때는 기대한 동작, 실제 동작, 재현 명령, OS와 Node.js 버전, 오류
메시지를 함께 남겨 주세요.
