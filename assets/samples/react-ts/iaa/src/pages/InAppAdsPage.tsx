import { useInAppAds } from "../hooks/useInAppAds";
import "./InAppAdsPage.css";

// TODO: 서비스를 출시하기 전에 앱인토스 콘솔에서 발급한 광고그룹ID로 변경해주세요.
const TEST_INTERSTITIAL_ID = "ait-ad-test-interstitial-id";
const TEST_REWARDED_ID = "ait-ad-test-rewarded-id";

interface InAppAdsPageProps {
  onBack: () => void;
}

export function InAppAdsPage({ onBack }: InAppAdsPageProps) {
  const interstitial = useInAppAds(TEST_INTERSTITIAL_ID);
  const rewarded = useInAppAds(TEST_REWARDED_ID);

  return (
    <>
      <div className="app-header">
        <h1 className="page-title">인앱광고</h1>
        {!interstitial.isSupported && (
          <p className="page-subtitle">
            이 환경에서는 인앱 광고를 사용할 수 없어요.
          </p>
        )}
      </div>

      <div className="iaa-section-list">
        <div className="iaa-section">
          <div className="iaa-section-row">
            <div className="iaa-section-info">
              <h2 className="iaa-section-title">전면형 광고</h2>
              <p className="iaa-section-desc">화면 전체에 표시되는 광고</p>
            </div>
            <button
              type="button"
              className="iaa-section-button"
              onClick={interstitial.showAd}
              disabled={!interstitial.isAdLoaded}
            >
              {interstitial.isAdLoaded ? "보기" : "로딩 중"}
            </button>
          </div>
        </div>

        <div className="iaa-section">
          <div className="iaa-section-row">
            <div className="iaa-section-info">
              <h2 className="iaa-section-title">보상형 광고</h2>
              <p className="iaa-section-desc">시청 완료 시 보상을 받는 광고</p>
            </div>
            <button
              type="button"
              className="iaa-section-button"
              onClick={rewarded.showAd}
              disabled={!rewarded.isAdLoaded}
            >
              {rewarded.isAdLoaded ? "보기" : "로딩 중"}
            </button>
          </div>

          {rewarded.lastReward && (
            <p className="iaa-reward-message">
              보상 획득: {rewarded.lastReward.unitType}{" "}
              {rewarded.lastReward.unitAmount}개
            </p>
          )}
        </div>
      </div>

      <button
        type="button"
        className="text-button iaa-back-btn"
        onClick={onBack}
      >
        ← 홈으로
      </button>
    </>
  );
}
