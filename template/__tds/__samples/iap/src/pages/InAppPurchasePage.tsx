import { colors } from "@toss/tds-colors";
import {
  Asset,
  Button,
  List,
  ListRow,
  Result,
  Text,
  TextButton,
  Top,
} from "@toss/tds-mobile";
import { useEffect } from "react";

import { useInAppPurchase } from "../hooks/useInAppPurchase";

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
        <Top
          title={<Top.TitleParagraph size={22}>인앱결제</Top.TitleParagraph>}
        />

        <Text style={{ padding: 24 }}>상품을 불러오는 중...</Text>
      </>
    );
  }

  if (products.length === 0) {
    return (
      <>
        <Top
          title={<Top.TitleParagraph size={22}>인앱결제</Top.TitleParagraph>}
        />

        <Result
          style={{ height: 300 }}
          title="인앱 상품이 없어요"
          description="콘솔 '인앱 결제' 메뉴에서 상품을 등록해 주세요."
          figure={
            <Asset.Image
              frameShape={Asset.frameShape.CleanW60}
              src={`${import.meta.env.BASE_URL}icon-document.png`}
              aria-hidden={true}
            />
          }
          button={<Result.Button onClick={onBack}>홈으로</Result.Button>}
        />
      </>
    );
  }

  return (
    <>
      <Top
        title={<Top.TitleParagraph size={22}>인앱결제</Top.TitleParagraph>}
      />

      <List>
        {products.map((product) => (
          <ListRow
            key={product.sku}
            verticalPadding="large"
            left={
              <ListRow.AssetImage
                src={product.iconUrl}
                shape="squircle"
                size="xsmall"
              />
            }
            contents={
              <ListRow.Texts
                type="3RowTypeA"
                top={product.displayName}
                topProps={{ color: colors.grey800, fontWeight: "bold" }}
                middle={product.description}
                middleProps={{ color: colors.grey600 }}
                bottom={product.displayAmount}
                bottomProps={{ color: colors.grey600 }}
              />
            }
            right={
              <Button
                size="small"
                variant="weak"
                loading={purchasingSku !== null}
                onClick={() => purchaseProduct(product.sku)}
              >
                구매하기
              </Button>
            }
          />
        ))}
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
