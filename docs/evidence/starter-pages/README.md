# 프레임워크별 첫 페이지 증적

Vite 9.2.0의 각 프레임워크 엔트리에 Apps in Toss 시작 화면을 적용한 뒤,
`npm run build` 결과의 `/index.html`을 Playwright Chromium(390×844)으로 캡처했어요.

| 프리셋  | JavaScript                | TypeScript                              |
| ------- | ------------------------- | --------------------------------------- |
| Lit     | ![Lit](./lit.png)         | ![Lit TypeScript](./lit-ts.png)         |
| Preact  | ![Preact](./preact.png)   | ![Preact TypeScript](./preact-ts.png)   |
| Qwik    | ![Qwik](./qwik.png)       | ![Qwik TypeScript](./qwik-ts.png)       |
| React   | ![React](./react.png)     | ![React TypeScript](./react-ts.png)     |
| Solid   | ![Solid](./solid.png)     | ![Solid TypeScript](./solid-ts.png)     |
| Svelte  | ![Svelte](./svelte.png)   | ![Svelte TypeScript](./svelte-ts.png)   |
| Vanilla | ![Vanilla](./vanilla.png) | ![Vanilla TypeScript](./vanilla-ts.png) |
| Vue     | ![Vue](./vue.png)         | ![Vue TypeScript](./vue-ts.png)         |

## TDS

![React TypeScript with TDS](./tds.png)

재현 명령:

```bash
AIT_RUN_E2E=1 \
AIT_E2E_TEMPLATES=all \
AIT_E2E_SCREENSHOT_DIR=docs/evidence/starter-pages \
yarn test:e2e
```
