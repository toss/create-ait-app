import { IAP } from "@apps-in-toss/web-framework";
import { useCallback, useEffect, useState } from "react";

// 참고문서: https://developers-apps-in-toss.toss.im/iap/intro.html
export function useInAppPurchase() {
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [purchasingSku, setPurchasingSku] = useState(null);

  useEffect(() => {
    async function fetchProducts() {
      setProductsLoading(true);

      try {
        const response = await IAP.getProductItemList();
        const fetchedProducts = response?.products ?? [];

        setProducts(fetchedProducts);
      } catch (error) {
        alert(
          "상품 목록 조회 실패: \n\n-앱인토스 콘솔에서 미니앱을 생성후 인앱상품을 등록해주세요\n- 인앱결제 기능은 브라우저가 아닌 샌드박스앱/토스앱에서 실행해주세요\n\n" +
            error,
        );
      } finally {
        setProductsLoading(false);
      }
    }

    fetchProducts();
  }, []);

  const grantProduct = useCallback((orderId) => {
    // TODO: 여기에 상품 지급 로직을 작성해주세요.
    console.info(`상품 지급 처리: ${orderId}`);
  }, []);

  const purchaseProduct = useCallback(
    (sku) => {
      setPurchasingSku(sku);

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

            setPurchasingSku(null);
            cleanup();
          },
          onError: (error) => {
            console.error("인앱결제 실패:", error);
            setPurchasingSku(null);
            cleanup();
          },
        });
      } catch (error) {
        console.error("인앱결제 실패:", error);
        setPurchasingSku(null);
      }
    },
    [grantProduct],
  );

  const restorePendingOrders = useCallback(async () => {
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
  }, [grantProduct]);

  return {
    products,
    purchaseProduct,
    restorePendingOrders,
    productsLoading,
    purchasingSku,
  };
}
