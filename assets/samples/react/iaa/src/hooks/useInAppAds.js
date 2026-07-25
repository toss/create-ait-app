import {
  loadFullScreenAd,
  showFullScreenAd,
} from "@apps-in-toss/web-framework";
import { useCallback, useEffect, useRef, useState } from "react";

// 참고문서: https://developers-apps-in-toss.toss.im/ads/intro.html
export function useInAppAds(adGroupId) {
  const [isAdLoaded, setIsAdLoaded] = useState(false);
  const [lastReward, setLastReward] = useState(null);
  const [isSupported, setIsSupported] = useState(false);
  const unregisterRef = useRef(null);

  const load = useCallback(() => {
    setIsAdLoaded(false);

    try {
      unregisterRef.current = loadFullScreenAd({
        options: { adGroupId },
        onEvent: (event) => {
          if (event.type === "loaded") {
            setIsAdLoaded(true);
          }
        },
        onError: (error) => {
          console.error("광고 로드 실패:", error);
        },
      });
    } catch (error) {
      alert(
        "광고 로드 실패: \n\n- 인앱광고 기능은 브라우저가 아닌 샌드박스앱/토스앱에서 실행해주세요\n\n" +
          error,
      );
    }
  }, [adGroupId]);

  useEffect(() => {
    try {
      setIsSupported(loadFullScreenAd.isSupported());

      if (loadFullScreenAd.isSupported()) {
        load();
      }
    } catch (error) {
      console.error("광고 지원 여부 확인 실패:", error);
      setIsSupported(false);
    }

    return () => {
      try {
        unregisterRef.current?.();
      } catch (error) {
        console.error("광고 정리(cleanup) 중 에러:", error);
      }
    };
  }, [load]);

  const showAd = useCallback(() => {
    if (!isSupported) {
      console.info("현재 환경에서는 인앱 광고가 지원되지 않습니다.");
      return;
    }

    if (!isAdLoaded) {
      console.info("아직 광고가 로드되지 않았습니다.");
      return;
    }

    try {
      showFullScreenAd({
        options: { adGroupId },
        onEvent: (event) => {
          switch (event.type) {
            case "userEarnedReward":
              setLastReward(event.data);
              break;
            case "dismissed":
              setIsAdLoaded(false);
              load();
              break;
            case "failedToShow":
              console.error("광고 표시 실패");
              setIsAdLoaded(false);
              load();
              break;
          }
        },
        onError: (error) => {
          console.error("광고 표시 실패:", error);
          setIsAdLoaded(false);
          load();
        },
      });
    } catch (error) {
      console.error("광고 표시 실패:", error);
      setIsAdLoaded(false);
      load();
    }
  }, [adGroupId, isAdLoaded, isSupported, load]);

  return { isAdLoaded, isSupported, showAd, lastReward };
}
