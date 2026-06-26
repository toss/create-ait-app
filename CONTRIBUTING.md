# 기여하기

create-ait-app에 기여해 주셔서 감사해요. 버그 수정, 기능 개선, 문서 보완, 템플릿·예제 코드 개선 모두 환영해요.

**Node.js 24 이상**이 필요해요.

## 시작하기

1. 저장소를 포크하고 로컬에 클론해요.
2. 의존성을 설치해요.

```bash
npm install
```

3. CLI를 전역에 연결해 로컬 변경 사항을 테스트해요.

```bash
npm link
create-ait-app test-project
```

4. 작업이 끝나면 연결을 해제해요.

```bash
npm unlink -g create-ait-app
```

프롬프트 없이 빠르게 확인하려면 `--inline` 옵션을 함께 쓰면 돼요.

```bash
create-ait-app test-project --inline --template react-ts --pm npm --sample iap,iaa
```

## 이슈 제보

버그나 개선 제안은 GitHub Issue로 등록해 주세요. 아래 정보를 포함하면 해결에 도움이 돼요.

- 어떤 문제인지 (기대한 동작 vs 실제 동작)
- 재현 방법 (사용한 CLI 옵션, 템플릿, 패키지 매니저 등)
- 환경 (OS, Node.js 버전)
- 가능하다면 에러 메시지나 스크린샷

## Pull Request

1. `main` 브랜치에서 작업 브랜치를 만들어요.
2. 변경 사항을 반영하고 로컬에서 동작을 확인해요.
3. PR을 열어요. [PR 템플릿](.github/PULL_REQUEST_TEMPLATE.md)에 맞춰 작성해 주세요.
4. 리뷰 피드백이 있으면 반영해 주세요.

`package.json`의 `version`은 올리지 않아도 돼요. 배포는 메인테이너가 진행해요.

### PR에 포함할 내용

| 섹션 | 설명 |
| --- | --- |
| Summary | 무엇을, 왜 바꿨는지 |
| Checklist | 확인 항목 체크 |
| Release Notes | 사용자에게 보이는 변경 사항 (없으면 비워 두세요) |
| Test Results | 로컬에서 확인한 내용 |
| Linked Issues | 연결된 이슈 (없으면 비워 두세요) |

### 커밋 메시지

[Conventional Commits](https://www.conventionalcommits.org/) 형식을 권장해요.

```
feat: 인앱결제 샘플에 빈 상태 아이콘 추가
fix: vanilla 템플릿 샘플 public 자산 누락 수정
docs: CONTRIBUTING 가이드 정리
refactor: scaffold 로직 분리
```

## 개발 가이드라인

### 변경 범위

- **CLI 로직**: `bin/`, `src/` 아래 파일을 수정해요.
- **생성되는 프로젝트**: `templates/<템플릿>/` 아래 해당 템플릿만 수정해요.
- 템플릿은 서로 독립적으로 관리돼요. 여러 템플릿에 같은 변경이 필요하면 각 폴더에 맞게 반영해 주세요.

### 템플릿·예제 코드 수정 시

- 템플릿을 바꿨다면 영향 받는 템플릿마다 프로젝트 생성을 확인해 주세요.
- 예제 코드(`--sample`)를 추가·수정할 때는 각 템플릿의 `samples/`와 `src/sample-configs.js`를 함께 맞춰 주세요.
- React 템플릿의 SDK 연동 로직은 `src/hooks/`, Vanilla(`js`/`ts`) 템플릿은 `src/lib/`에 두는 기존 규칙을 따라 주세요.
- 이미 생성된 프로젝트에는 `create-ait-app add-sample iap`으로 예제를 추가할 수 있어요.

### 문서

CLI 옵션이나 동작이 바뀌면 [README.md](./README.md)도 함께 업데이트해 주세요.

## 질문

Issue에 질문을 남겨 주시면 확인해 볼게요.
