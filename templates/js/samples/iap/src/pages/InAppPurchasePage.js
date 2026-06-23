import { createInAppPurchase } from "../hooks/inAppPurchase.js";
import "./InAppPurchasePage.css";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function mountInAppPurchasePage(onBack) {
  const root = document.getElementById("root");
  const iap = createInAppPurchase();

  function render() {
    const { products, productsLoading, purchasingSku } = iap.getState();

    if (productsLoading) {
      root.innerHTML = `
        <div class="app-header">
          <h1 class="page-title">인앱결제</h1>
        </div>
        <p>상품을 불러오는 중...</p>
      `;
      return;
    }

    if (products.length === 0) {
      root.innerHTML = `
        <div class="app-header">
          <h1 class="page-title">인앱결제</h1>
        </div>
        <div class="iap-empty-state">
          <img class="iap-empty-state-icon" src="icon-document.png" aria-hidden alt="" />
          <div class="iap-empty-state-content">
            <h2 class="iap-empty-state-title">인앱 상품이 없어요</h2>
            <p class="iap-empty-state-desc">콘솔 '인앱 결제' 메뉴에서 상품을 등록해 주세요.</p>
          </div>
          <button type="button" class="iap-empty-state-back-btn" data-action="back">홈으로</button>
        </div>
      `;
      root.querySelector('[data-action="back"]')?.addEventListener("click", onBack);
      return;
    }

    const productItems = products
      .map(
        (product) => `
          <div class="iap-product-item">
            <div class="iap-product-info">
              ${
                product.iconUrl
                  ? `<img class="iap-product-icon" src="${escapeHtml(product.iconUrl)}" alt="${escapeHtml(product.displayName)}" />`
                  : ""
              }
              <div class="iap-product-details">
                <div class="iap-product-name">${escapeHtml(product.displayName)}</div>
                ${
                  product.description
                    ? `<div class="iap-product-description">${escapeHtml(product.description)}</div>`
                    : ""
                }
                <div class="iap-product-amount">${escapeHtml(product.displayAmount)}</div>
              </div>
            </div>
            <button
              type="button"
              class="iap-product-buy-btn"
              data-sku="${escapeHtml(product.sku)}"
              ${purchasingSku !== null ? "disabled" : ""}
            >
              ${purchasingSku === product.sku ? "결제 처리 중" : "구매하기"}
            </button>
          </div>
        `,
      )
      .join("");

    root.innerHTML = `
      <div class="app-header">
        <h1 class="page-title">인앱결제</h1>
      </div>
      <div class="iap-product-list">
        ${productItems}
        <button type="button" class="text-button iap-back-btn" data-action="back">← 홈으로</button>
      </div>
    `;

    root.querySelector('[data-action="back"]')?.addEventListener("click", onBack);
    root.querySelectorAll("[data-sku]").forEach((button) => {
      button.addEventListener("click", () => {
        iap.purchaseProduct(button.dataset.sku);
      });
    });
  }

  iap.subscribe(render);
  iap.restorePendingOrders();
  render();
}
