import type { IapProductListItem } from "@apps-in-toss/web-framework";
import { IAP } from "@apps-in-toss/web-framework";

type Listener = () => void;

interface InAppPurchaseState {
  products: IapProductListItem[];
  productsLoading: boolean;
  purchasingSku: string | null;
}

// 참고문서: https://developers-apps-in-toss.toss.im/iap/intro.html
export function createInAppPurchase() {
  const state: InAppPurchaseState = {
    products: [],
    productsLoading: false,
    purchasingSku: null,
  };

  let onUpdate: Listener = () => {};

  function notify() {
    onUpdate();
  }

  function grantProduct(orderId: string) {
    // TODO: 여기에 상품 지급 로직을 작성해주세요.
    console.info(`상품 지급 처리: ${orderId}`);
  }

  async function fetchProducts() {
    state.productsLoading = true;
    notify();

    try {
      const response = await IAP.getProductItemList();
      state.products = response?.products ?? [];
    } catch (error) {
      alert(
        "상품 목록 조회 실패: \n\n-앱인토스 콘솔에서 미니앱을 생성후 인앱상품을 등록해주세요\n- 인앱결제 기능은 브라우저가 아닌 샌드박스앱/토스앱에서 실행해주세요\n\n" +
          error,
      );
    } finally {
      state.productsLoading = false;
      notify();
    }
  }

  function purchaseProduct(sku: string) {
    state.purchasingSku = sku;
    notify();

    try {
      const cleanup = IAP.createOneTimePurchaseOrder({
        options: {
          sku,
          processProductGrant: ({ orderId }) => {
            grantProduct(orderId);
            console.info(`상품 지급 처리: ${orderId}`);
            return true;
          },
        },
        onEvent: (event) => {
          if (event.type === "success") {
            alert(`${event.data.displayName}이 결제되었어요.`);
          }

          state.purchasingSku = null;
          notify();
          cleanup();
        },
        onError: (error) => {
          console.error("인앱결제 실패:", error);
          state.purchasingSku = null;
          notify();
          cleanup();
        },
      });
    } catch (error) {
      console.error("인앱결제 실패:", error);
      state.purchasingSku = null;
      notify();
    }
  }

  async function restorePendingOrders() {
    try {
      const pending = await IAP.getPendingOrders();
      const orders = pending?.orders ?? [];

      for (const order of orders) {
        grantProduct(order.orderId);
        await IAP.completeProductGrant({ params: { orderId: order.orderId } });
        console.info("미결 주문 복원 완료:", order.orderId);
      }
    } catch (error) {
      console.error("주문 복원 실패:", error);
    }
  }

  fetchProducts();

  return {
    getState: () => state,
    purchaseProduct,
    restorePendingOrders,
    subscribe: (listener: Listener) => {
      onUpdate = listener;
      return () => {
        onUpdate = () => {};
      };
    },
  };
}
