import { useEffect } from "react";

import { useInAppPurchase } from "../hooks/useInAppPurchase";
import "./InAppPurchasePage.css";

interface InAppPurchasePageProps {
  onBack: () => void;
}

export function InAppPurchasePage({ onBack }: InAppPurchasePageProps) {
  const {
    products,
    purchaseProduct,
    restorePendingOrders,
    productsLoading,
    purchasingSku,
  } = useInAppPurchase();

  useEffect(() => {
    restorePendingOrders();
  }, [restorePendingOrders]);

  if (productsLoading) {
    return (
      <>
        <div className="app-header">
          <h1 className="page-title">인앱결제</h1>
        </div>

        <p>상품을 불러오는 중...</p>
      </>
    );
  }

  if (products.length === 0) {
    return (
      <>
        <div className="app-header">
          <h1 className="page-title">인앱결제</h1>
        </div>

        <div className="iap-empty-state">
          <img
            className="iap-empty-state-icon"
            src="icon-document.png"
            aria-hidden
            alt=""
          />
          <div className="iap-empty-state-content">
            <h2 className="iap-empty-state-title">인앱 상품이 없어요</h2>
            <p className="iap-empty-state-desc">
              콘솔 '인앱 결제' 메뉴에서 상품을 등록해 주세요.
            </p>
          </div>

          <button
            type="button"
            className="iap-empty-state-back-btn"
            onClick={onBack}
          >
            홈으로
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="app-header">
        <h1 className="page-title">인앱결제</h1>
      </div>

      <div className="iap-product-list">
        {products.map((product) => (
          <div key={product.sku} className="iap-product-item">
            <div className="iap-product-info">
              {product.iconUrl && (
                <img
                  className="iap-product-icon"
                  src={product.iconUrl}
                  alt={product.displayName}
                />
              )}
              <div className="iap-product-details">
                <div className="iap-product-name">{product.displayName}</div>
                {product.description && (
                  <div className="iap-product-description">
                    {product.description}
                  </div>
                )}
                <div className="iap-product-amount">
                  {product.displayAmount}
                </div>
              </div>
            </div>

            <button
              type="button"
              className="iap-product-buy-btn"
              onClick={() => purchaseProduct(product.sku)}
              disabled={purchasingSku !== null}
            >
              {purchasingSku === product.sku ? "결제 처리 중" : "구매하기"}
            </button>
          </div>
        ))}

        <button
          type="button"
          className="text-button iap-back-btn"
          onClick={onBack}
        >
          ← 홈으로
        </button>
      </div>
    </>
  );
}
