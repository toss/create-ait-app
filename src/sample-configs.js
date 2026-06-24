/**
 * React + TypeScript 샘플 주입 메타데이터 (react-ts)
 */
const REACT_SAMPLE_CONFIG = {
  iap: {
    displayName: "인앱결제",
    import: 'import { InAppPurchasePage } from "./pages/InAppPurchasePage";',
    route:
      '  if (page === "iap") return <InAppPurchasePage onBack={() => setPage(null)} />;',
    getButton: () =>
      '<button type="button" className="app-button app-button-ghost" onClick={() => setPage("iap")}>인앱결제 테스트하기</button>',
  },
  iaa: {
    displayName: "인앱광고",
    import: 'import { InAppAdsPage } from "./pages/InAppAdsPage";',
    route:
      '  if (page === "iaa") return <InAppAdsPage onBack={() => setPage(null)} />;',
    getButton: () =>
      '<button type="button" className="app-button app-button-ghost" onClick={() => setPage("iaa")}>인앱광고 테스트하기</button>',
  },
};

/**
 * React + JavaScript 샘플 주입 메타데이터 (react)
 */
const REACT_JS_SAMPLE_CONFIG = {
  iap: {
    displayName: "인앱결제",
    import:
      'import { InAppPurchasePage } from "./pages/InAppPurchasePage.jsx";',
    route:
      '  if (page === "iap") return <InAppPurchasePage onBack={() => setPage(null)} />;',
    getButton: () =>
      '<button type="button" className="app-button app-button-ghost" onClick={() => setPage("iap")}>인앱결제 테스트하기</button>',
  },
  iaa: {
    displayName: "인앱광고",
    import: 'import { InAppAdsPage } from "./pages/InAppAdsPage.jsx";',
    route:
      '  if (page === "iaa") return <InAppAdsPage onBack={() => setPage(null)} />;',
    getButton: () =>
      '<button type="button" className="app-button app-button-ghost" onClick={() => setPage("iaa")}>인앱광고 테스트하기</button>',
  },
};

/**
 * React + TypeScript + TDS 샘플 주입 메타데이터 (react-ts-tds)
 */
const REACT_TDS_SAMPLE_CONFIG = {
  iap: {
    displayName: "인앱결제",
    import: 'import { InAppPurchasePage } from "./pages/InAppPurchasePage";',
    route:
      '  if (page === "iap") return <InAppPurchasePage onBack={() => setPage(null)} />;',
    getButton: () =>
      '<Button color="dark" variant="weak" onClick={() => setPage("iap")}>인앱결제 테스트하기</Button>',
  },
  iaa: {
    displayName: "인앱광고",
    import: 'import { InAppAdsPage } from "./pages/InAppAdsPage";',
    route:
      '  if (page === "iaa") return <InAppAdsPage onBack={() => setPage(null)} />;',
    getButton: () =>
      '<Button color="dark" variant="weak" onClick={() => setPage("iaa")}>인앱광고 테스트하기</Button>',
  },
};

/**
 * Vanilla JavaScript 샘플 주입 메타데이터 (js)
 */
const JS_SAMPLE_CONFIG = {
  iap: {
    displayName: "인앱결제",
    import:
      'import { mountInAppPurchasePage } from "./pages/InAppPurchasePage.js";',
    route: `  if (currentPage === "iap") {
    mountInAppPurchasePage(() => {
      currentPage = null;
      render();
    });
    return;
  }`,
    getButton: () =>
      '<button type="button" class="app-button app-button-ghost" data-page="iap">인앱결제 테스트하기</button>',
  },
  iaa: {
    displayName: "인앱광고",
    import: 'import { mountInAppAdsPage } from "./pages/InAppAdsPage.js";',
    route: `  if (currentPage === "iaa") {
    mountInAppAdsPage(() => {
      currentPage = null;
      render();
    });
    return;
  }`,
    getButton: () =>
      '<button type="button" class="app-button app-button-ghost" data-page="iaa">인앱광고 테스트하기</button>',
  },
};

/**
 * Vanilla TypeScript 샘플 주입 메타데이터 (ts)
 */
const TS_SAMPLE_CONFIG = {
  iap: {
    displayName: "인앱결제",
    import:
      'import { mountInAppPurchasePage } from "./pages/InAppPurchasePage.ts";',
    route: `  if (currentPage === "iap") {
    mountInAppPurchasePage(() => {
      currentPage = null;
      render();
    });
    return;
  }`,
    getButton: () =>
      '<button type="button" class="app-button app-button-ghost" data-page="iap">인앱결제 테스트하기</button>',
  },
  iaa: {
    displayName: "인앱광고",
    import: 'import { mountInAppAdsPage } from "./pages/InAppAdsPage.ts";',
    route: `  if (currentPage === "iaa") {
    mountInAppAdsPage(() => {
      currentPage = null;
      render();
    });
    return;
  }`,
    getButton: () =>
      '<button type="button" class="app-button app-button-ghost" data-page="iaa">인앱광고 테스트하기</button>',
  },
};

module.exports = {
  REACT_SAMPLE_CONFIG,
  REACT_JS_SAMPLE_CONFIG,
  REACT_TDS_SAMPLE_CONFIG,
  JS_SAMPLE_CONFIG,
  TS_SAMPLE_CONFIG,
};
