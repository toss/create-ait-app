import { colors } from "@toss/tds-colors";
import { Button, List, ListRow, TextButton, Top } from "@toss/tds-mobile";

import { useInAppAds } from "../hooks/useInAppAds";

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
      <Top
        title={<Top.TitleParagraph size={22}>인앱광고</Top.TitleParagraph>}
        subtitleBottom={
          !interstitial.isSupported && (
            <Top.SubtitleParagraph
              size={17}
              style={{ overflow: `visible`, display: `block` }}
            >
              이 환경에서는 인앱 광고를 사용할 수 없어요.
            </Top.SubtitleParagraph>
          )
        }
      />

      <List>
        <ListRow
          verticalPadding="large"
          contents={
            <ListRow.Texts
              type="2RowTypeA"
              top="전면형 광고"
              topProps={{ color: colors.grey800, fontWeight: "bold" }}
              bottom="화면 전체에 표시되는 광고"
              bottomProps={{ color: colors.grey600 }}
            />
          }
          right={
            <Button
              size="small"
              variant="weak"
              loading={!interstitial.isAdLoaded}
              onClick={interstitial.showAd}
            >
              보기
            </Button>
          }
        />

        <ListRow
          verticalPadding="large"
          contents={
            <ListRow.Texts
              type="2RowTypeA"
              top="보상형 광고"
              topProps={{ color: colors.grey800, fontWeight: "bold" }}
              bottom="시청 완료 시 보상을 받는 광고"
              bottomProps={{ color: colors.grey600 }}
            />
          }
          right={
            <Button
              size="small"
              variant="weak"
              loading={!rewarded.isAdLoaded}
              onClick={rewarded.showAd}
            >
              보기
            </Button>
          }
        />
      </List>

      <TextButton
        style={{ padding: "16px 24px" }}
        size="medium"
        color={colors.blue500}
        onClick={onBack}
      >
        ← 홈으로
      </TextButton>
    </>
  );
}
