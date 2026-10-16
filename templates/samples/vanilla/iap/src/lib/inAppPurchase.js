import { IAP } from "@apps-in-toss/web-framework";

// 참고문서: https://developers-apps-in-toss.toss.im/iap/intro.html
export function createInAppPurchase() {
  const state = {
    products: [],
    productsLoading: false,
    purchasingSku: null,
  };

  let onUpdate = () => {};

  function notify() {
    onUpdate();
  }

  function grantProduct(orderId) {
    // TODO: 상품 지급 로직을 작성해 주세요. 지금은 데모라서 아무것도 지급하지 않아요.
    // - 상품을 지급하고, 지급 결과를 가급적 서버에 저장해주세요.
    // - 같은 orderId로 두 번 지급하지 않도록 처리해 주세요.
    // 참고문서: https://developers-apps-in-toss.toss.im/guide/monetization/in-app-payment
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
        "상품 목록 조회 실패: \n\n-앱인토스 콘솔에서 미니앱을 만든 뒤 인앱 상품을 등록해 주세요\n- 인앱 결제 기능은 브라우저가 아닌 샌드박스 앱/토스 앱에서 실행해 주세요\n\n" +
          error,
      );
    } finally {
      state.productsLoading = false;
      notify();
    }
  }

  function purchaseProduct(sku) {
    state.purchasingSku = sku;
    notify();

    try {
      const cleanup = IAP.createOneTimePurchaseOrder({
        options: {
          sku,
          processProductGrant: ({ orderId }) => {
            grantProduct(orderId);
            console.info(`상품 지급 처리: ${orderId}`);
            // 지급이 실제로 성공했을 때만 true를 반환해 주세요.
            // 실패하면 false를 반환해 주세요. 미결 주문으로 남아 restorePendingOrders에서 다시 처리돼요.
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
          console.error("인앱 결제 실패:", error);
          state.purchasingSku = null;
          notify();
          cleanup();
        },
      });
    } catch (error) {
      console.error("인앱 결제 실패:", error);
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
        // 지급에 성공한 주문만 완료 처리해 주세요.
        // 지급에 실패한 주문은 완료 처리하지 말고, 다음 복구 때 다시 처리되도록 남겨 두세요.
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
    subscribe: (listener) => {
      onUpdate = listener;
      return () => {
        onUpdate = () => {};
      };
    },
  };
}
