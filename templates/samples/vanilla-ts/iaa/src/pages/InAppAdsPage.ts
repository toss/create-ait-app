import { createInAppAds } from "../lib/inAppAds.ts";
import "./InAppAdsPage.css";

// TODO: 서비스를 출시하기 전에 앱인토스 콘솔에서 발급한 광고 그룹 ID로 변경해 주세요.
const TEST_INTERSTITIAL_ID = "ait-ad-test-interstitial-id";
const TEST_REWARDED_ID = "ait-ad-test-rewarded-id";

function escapeHtml(value: unknown) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function mountInAppAdsPage(onBack: () => void) {
  const root = document.getElementById("root");
  if (!root) return;
  const rootElement: HTMLElement = root;

  const interstitial = createInAppAds(TEST_INTERSTITIAL_ID);
  const rewarded = createInAppAds(TEST_REWARDED_ID);
  let unsubscribe = () => {};

  function closePage() {
    unsubscribe();
    onBack();
  }

  function render() {
    const interstitialState = interstitial.getState();
    const rewardedState = rewarded.getState();

    rootElement.innerHTML = `
      <div class="app-header">
        <h1 class="page-title">인앱 광고</h1>
        ${
          !interstitialState.isSupported
            ? '<p class="page-subtitle">이 환경에서는 인앱 광고를 사용할 수 없어요.</p>'
            : ""
        }
      </div>

      <div class="iaa-section-list">
        <div class="iaa-section">
          <div class="iaa-section-row">
            <div class="iaa-section-info">
              <h2 class="iaa-section-title">전면형 광고</h2>
              <p class="iaa-section-desc">화면 전체에 표시되는 광고</p>
            </div>
            <button
              type="button"
              class="iaa-section-button"
              data-action="show-interstitial"
              ${interstitialState.isAdLoaded ? "" : "disabled"}
            >
              ${interstitialState.isAdLoaded ? "보기" : "로딩 중"}
            </button>
          </div>
        </div>

        <div class="iaa-section">
          <div class="iaa-section-row">
            <div class="iaa-section-info">
              <h2 class="iaa-section-title">보상형 광고</h2>
              <p class="iaa-section-desc">시청 완료 시 보상을 받는 광고</p>
            </div>
            <button
              type="button"
              class="iaa-section-button"
              data-action="show-rewarded"
              ${rewardedState.isAdLoaded ? "" : "disabled"}
            >
              ${rewardedState.isAdLoaded ? "보기" : "로딩 중"}
            </button>
          </div>
          ${
            rewardedState.lastReward
              ? `<p class="iaa-reward-message">보상 획득: ${escapeHtml(rewardedState.lastReward.unitType)} ${escapeHtml(rewardedState.lastReward.unitAmount)}개</p>`
              : ""
          }
        </div>
      </div>

      <button type="button" class="text-button iaa-back-btn" data-action="back">← 홈으로</button>
    `;

    rootElement
      .querySelector('[data-action="show-interstitial"]')
      ?.addEventListener("click", () => interstitial.showAd());
    rootElement
      .querySelector('[data-action="show-rewarded"]')
      ?.addEventListener("click", () => rewarded.showAd());
    rootElement.querySelector('[data-action="back"]')?.addEventListener("click", closePage);
  }

  const unsubscribeInterstitial = interstitial.subscribe(render);
  const unsubscribeRewarded = rewarded.subscribe(render);
  unsubscribe = () => {
    unsubscribeInterstitial();
    unsubscribeRewarded();
  };
  render();
  return unsubscribe;
}
