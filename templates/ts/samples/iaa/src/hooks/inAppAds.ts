import {
  loadFullScreenAd,
  showFullScreenAd,
} from "@apps-in-toss/web-framework";

type Listener = () => void;

interface Reward {
  unitType: string;
  unitAmount: number;
}

interface InAppAdsState {
  isAdLoaded: boolean;
  isSupported: boolean;
  lastReward: Reward | null;
}

// 참고문서: https://developers-apps-in-toss.toss.im/ads/intro.html
export function createInAppAds(adGroupId: string) {
  const state: InAppAdsState = {
    isAdLoaded: false,
    isSupported: false,
    lastReward: null,
  };

  let onUpdate: Listener = () => {};
  let unregister: (() => void) | null = null;

  function notify() {
    onUpdate();
  }

  function load() {
    state.isAdLoaded = false;
    notify();

    try {
      unregister = loadFullScreenAd({
        options: { adGroupId },
        onEvent: (event) => {
          if (event.type === "loaded") {
            state.isAdLoaded = true;
            notify();
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
  }

  function showAd() {
    if (!state.isSupported) {
      console.info("현재 환경에서는 인앱 광고가 지원되지 않습니다.");
      return;
    }

    if (!state.isAdLoaded) {
      console.info("아직 광고가 로드되지 않았습니다.");
      return;
    }

    try {
      showFullScreenAd({
        options: { adGroupId },
        onEvent: (event) => {
          switch (event.type) {
            case "userEarnedReward":
              state.lastReward = event.data;
              notify();
              break;
            case "dismissed":
              state.isAdLoaded = false;
              notify();
              load();
              break;
            case "failedToShow":
              console.error("광고 표시 실패");
              state.isAdLoaded = false;
              notify();
              load();
              break;
          }
        },
        onError: (error) => {
          console.error("광고 표시 실패:", error);
          state.isAdLoaded = false;
          notify();
          load();
        },
      });
    } catch (error) {
      console.error("광고 표시 실패:", error);
      state.isAdLoaded = false;
      notify();
      load();
    }
  }

  try {
    state.isSupported = loadFullScreenAd.isSupported();
    if (state.isSupported) {
      load();
    }
  } catch (error) {
    console.error("광고 지원 여부 확인 실패:", error);
    state.isSupported = false;
  }

  return {
    getState: () => state,
    showAd,
    subscribe: (listener: Listener) => {
      onUpdate = listener;
      return () => {
        onUpdate = () => {};
        try {
          unregister?.();
        } catch (error) {
          console.error("광고 정리(cleanup) 중 에러:", error);
        }
      };
    },
  };
}
