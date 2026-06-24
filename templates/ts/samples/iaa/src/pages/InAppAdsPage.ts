import { createInAppAds } from "../lib/inAppAds.ts";
import "./InAppAdsPage.css";

// TODO: 서비스를 출시하기 전에 앱인토스 콘솔에서 발급한 광고그룹ID로 변경해주세요.
const TEST_INTERSTITIAL_ID = "ait-ad-test-interstitial-id";
const TEST_REWARDED_ID = "ait-ad-test-rewarded-id";

export function mountInAppAdsPage(onBack: () => void) {
  const root = document.getElementById("root");
  if (!root) return;

  const interstitial = createInAppAds(TEST_INTERSTITIAL_ID);
  const rewarded = createInAppAds(TEST_REWARDED_ID);

  function render() {
    const interstitialState = interstitial.getState();
    const rewardedState = rewarded.getState();

    root.innerHTML = `
      <div class="app-header">
        <h1 class="page-title">인앱광고</h1>
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
              ? `<p class="iaa-reward-message">보상 획득: ${rewardedState.lastReward.unitType} ${rewardedState.lastReward.unitAmount}개</p>`
              : ""
          }
        </div>
      </div>

      <button type="button" class="text-button iaa-back-btn" data-action="back">← 홈으로</button>
    `;

    root
      .querySelector('[data-action="show-interstitial"]')
      ?.addEventListener("click", () => interstitial.showAd());
    root
      .querySelector('[data-action="show-rewarded"]')
      ?.addEventListener("click", () => rewarded.showAd());
    root.querySelector('[data-action="back"]')?.addEventListener("click", onBack);
  }

  interstitial.subscribe(render);
  rewarded.subscribe(render);
  render();
}
