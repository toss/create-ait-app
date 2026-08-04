# 기여하기

create-ait-app에 기여해 주셔서 감사해요. Node.js 24 이상과 Corepack이 필요해요.

## 개발 환경 설정하기

이 저장소는 Yarn 4 Plug'n'Play를 사용해요.

```bash
corepack enable
yarn install --immutable
```

VS Code에서는 저장소에 포함된 Yarn TypeScript SDK와 ZipFS 확장 권장을 사용해요. 워크스페이스를 연 뒤 TypeScript 버전 선택에서 `Use Workspace Version`을 선택하면 PnP 의존성 타입을 정상적으로 탐색할 수 있어요.

개발 중 CLI를 실행하려면 먼저 빌드해 주세요.

```bash
yarn build
yarn exec create-ait-app test-project --inline --template react-ts --pm npm
```

## 품질 검사 실행하기

PR을 열기 전에 전체 검사를 실행해 주세요.

```bash
yarn format:check
yarn lint
yarn typecheck
yarn test
yarn build
yarn publint
```

CI에서는 각 검사를 병렬로 실행해요. 포맷을 적용하려면 `yarn format`을 사용해 주세요.

스캐폴딩 테스트는 생성한 프로젝트를 실제로 설치하고 빌드해요. 정적 HTML과 `.ait` 산출물이 나오는지 확인하고 개발 서버까지 띄워 봐요.

```bash
yarn test:e2e
AIT_E2E_TEMPLATES=all yarn test:e2e
```

기본값은 `react-ts`예요. `all`은 고정된 `create-vite` 패키지에서 프리셋을 동적으로 읽어요. SSR(Server-Side Rendering) 전용 빌드만 제외하고 나머지 모든 프리셋과 TDS 템플릿을 검사해요. 순수 CSR(Client-Side Rendering)과 SSG(Static Site Generation) 방식은 모두 대상이에요.

## 구조와 변경 원칙 따르기

### 모듈 구조

- `src/index.ts`는 `src/cli.ts`만 불러오는 실행 진입점이에요. 내부 모듈을 공개 API로 재노출하지 않아요.
- 내부 의존성은 `system → project → apps-in-toss/package-manager/vite/samples → scaffold → cli` 방향으로만 이어져요. 상위 계층에서 하위 계층을 역참조하지 마세요.
- `apps-in-toss/version-policy.ts`는 의존성이 없는 정책 상수라 `package-manager`도 참조해요. 반대로 `apps-in-toss/ait-init.ts`는 `package-manager`의 타입만 가져오므로 빌드 결과에는 순환이 남지 않아요. 이 관계에 런타임 의존을 새로 추가하지 마세요.
- 공용 `types.ts`를 만들지 않아요. `PackageJson`과 `SampleId`, `PackageManager`, `BaseProject` 같은 타입은 해당 책임을 구현하는 모듈에 함께 둬요.

### 빌드 산출물

- `tsdown.config.ts`에서 공개 export를 생성해요.
- `dist/`와 `package.json`의 export 경로는 tsdown이 관리해요. bin 경로는 `package.json`에서 관리해요.

### 템플릿 관리

- 일반 정적 클라이언트 앱의 뼈대는 `create-vite`가 유일한 원본이에요. 저장소에 프레임워크별 전체 템플릿을 복제하지 마세요.
- create-vite 실행 뒤 루트 `index.html`과 Vite 의존성, `dev` 스크립트와 `build` 스크립트를 확인해요. Vite SSR 번들만 만드는 `build`는 거부해요.
- `templates/projects/react-ts-tds/`는 React 18이 필요한 TDS(Toss Design System) 전용 예외예요.
- 생성 결과에 복사하는 파일 원본은 `templates/`에서 관리해요. 완성형 프로젝트 뼈대는 `templates/projects/`에 두고 선택형 예제 조각은 `templates/samples/`에 둬요. 예제는 지원되는 React와 Vanilla 계열에만 적용해요.

### 생성 결과와 CLI 동작

- 생성한 프로젝트의 `build`는 Vite 빌드 뒤 `ait build`를 실행하고 `deploy`는 `ait deploy`를 실행해요.
- 생성 프로젝트의 `@apps-in-toss/web-framework` 버전은 `src/apps-in-toss/version-policy.ts`의 `APPS_IN_TOSS_WEB_FRAMEWORK_VERSION`만 SSoT로 사용해요. `beta`와 `rc`, `latest` 사이에서 전환할 때는 이 값 하나만 바꿔요.
- `--inline`은 프로젝트 경로와 `--pm`이 있고 `--template` 또는 `--tds` 중 하나가 있을 때만 실행해요. 필수값이 빠졌을 때 대화형 프롬프트로 넘어가지 말고 즉시 오류를 내야 해요.

## create-vite 업데이트하기

`create-vite`는 `package.json`에 정확한 버전으로 고정해요. 수동으로 올릴 때는 다음 검증을 모두 통과해야 해요.

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

Dependabot은 매일 오전 9시(KST)에 create-vite 새 버전을 확인해요. create-vite는 기본 업데이트 대기 기간을 적용하지 않아요. 새 버전이 있으면 `package.json`과 `yarn.lock`을 업데이트하는 PR을 만들어요.

Dependabot PR에서도 일반 PR과 같은 `.github/workflows/ci.yml`이 실행돼요. 모든 검사와 동적으로 찾은 정적 클라이언트 프리셋 및 TDS 스캐폴딩 테스트가 성공한 뒤에만 병합해 주세요.

## 풀 리퀘스트 보내기

1. `main`에서 작업 브랜치를 만들어요.
2. 구현과 직접 영향받는 문서를 함께 수정해요.
3. 위 품질 검사와 필요한 스캐폴딩 테스트를 실행하고 결과를 확인해요.
4. [PR 템플릿](./PULL_REQUEST_TEMPLATE.md)에 맞춰 PR을 작성해요.

`package.json`의 create-ait-app 버전은 메인테이너가 관리하므로 일반 PR에서는 올리지 않아도 돼요. 커밋 메시지는 Conventional Commits 형식을 권장해요.

```text
feat: 모든 Vite 정적 클라이언트 프리셋 지원
fix: 생성 프로젝트의 SSR 전용 빌드 판별 보완
docs: create-vite 업데이트 정책 설명
```

## 릴리스하기

릴리스는 최신 `main` 브랜치의 깨끗한 작업 트리에서 진행해요. `release-it`이 버전을 올리고 `chore: release v<version>` 커밋과 Git 태그를 push해요. 그러면 GitHub Actions가 품질 검사를 거쳐 npm과 GitHub Release에 배포해요.

안정 버전은 다음 명령으로 만들어요.

```bash
yarn release-it
```

첫 beta는 올릴 버전 종류를 함께 지정해요. 이후 beta에서는 같은 명령을 다시 실행하면 `beta` 번호가 올라가요. 검증이 끝나면 RC로 전환하고 RC 검증까지 끝나면 안정 버전을 배포해요.

```bash
yarn release-it major --preRelease=beta  # 첫 beta
yarn release-it --preRelease=beta        # 이후 beta
yarn release-it --preRelease=rc          # RC 전환
yarn release-it                          # 안정 버전
```

beta와 RC는 각각 npm의 `beta`와 `rc` dist-tag로 배포해요. 안정 버전은 `latest`로 배포해요.

```bash
npm install create-ait-app@beta
npm install create-ait-app@rc
npm install create-ait-app@latest
```

`alpha`처럼 정책에 없는 prerelease 채널은 배포 워크플로에서 거부해요.

## 버그 제보하기

[이슈](https://github.com/toss/create-ait-app/issues/new/choose)를 열어 주세요. 버그 리포트 템플릿이 필요한 정보를 순서대로 물어봐요.
