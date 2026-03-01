import { DEFAULT_VAT_RATE } from "@/features/order/constants/order.constants";
import type {
  LineItem,
  OrderBreakdown,
} from "@/features/order/types/order.types";
import { AppError } from "@/shared/exceptions/AppError";
import { toNumber } from "@/shared/utils/firestore.utils";
import { findProduct } from "./order-helpers";

export function calcLineItem(
  product: Record<string, unknown> & { id: string },
  qty: number,
  isGroupBuy: boolean,
  currentGroupQty = 0,
): LineItem {
  const normalPrice = toNumber(
    product["basePrice"] ?? product["normalPrice"] ?? product["price"],
    0,
  );
  const groupDiscountPercent = toNumber(product["groupDiscountPercent"], 0);
  const qtyThreshold = toNumber(product["qtyThreshold"], 0);
  const groupPrice = toNumber(product["groupPrice"], 0);

  // Group pricing only applies when the quantity threshold is already met.
  // thresholdMet = true when there is no threshold requirement (qtyThreshold <= 0)
  //                OR the cumulative group qty (including this order) reaches the threshold.
  const thresholdMet =
    qtyThreshold <= 0 || currentGroupQty + qty >= qtyThreshold;

  let basePrice: number;
  if (isGroupBuy && thresholdMet) {
    if (groupPrice > 0) {
      basePrice = groupPrice;
    } else if (groupDiscountPercent > 0) {
      basePrice = Math.round(normalPrice * (1 - groupDiscountPercent / 100));
    } else {
      basePrice = normalPrice;
    }
  } else {
    basePrice = normalPrice;
  }

  // itemDiscountPercent is now fully captured in basePrice above.
  const itemDiscountPercent =
    normalPrice > 0 && basePrice < normalPrice
      ? Math.round((1 - basePrice / normalPrice) * 100)
      : 0;

  const discountedUnitPrice = basePrice;
  const lineTotalBeforeVat = discountedUnitPrice * qty;
  const discountAmount = (normalPrice - discountedUnitPrice) * qty;

  return {
    productId:
      typeof product["id"] === "string"
        ? product["id"]
        : typeof product["productId"] === "string"
          ? product["productId"]
          : "",
    productName: typeof product["name"] === "string" ? product["name"] : "",
    qty,
    normalPrice,
    basePrice,
    itemDiscountPercent,
    discountAmount,
    discountedUnitPrice,
    lineTotalBeforeVat,
  };
}

export function calcOrderBreakdown(
  event: Record<string, unknown>,
  items: Array<{ productId: string; qty: number }>,
  isGroupBuy: boolean,
): OrderBreakdown {
  const vatRate = toNumber(event["vatRate"], DEFAULT_VAT_RATE);
  const discountRules = (event["discountRules"] ?? {}) as Record<
    string,
    Record<string, unknown>
  >;
  const groupBuyRules = discountRules["groupBuy"] ?? {};
  const productGroupQty = (event["productGroupQty"] ?? {}) as Record<
    string,
    unknown
  >;

  const orderItems = items.map((inputItem) => {
    const product = findProduct(event, inputItem.productId);
    if (!product) {
      throw AppError.badRequest(
        `Product "${inputItem.productId}" not found in event`,
      );
    }
    const currentGroupQty = toNumber(productGroupQty[inputItem.productId], 0);
    return calcLineItem(product, inputItem.qty, isGroupBuy, currentGroupQty);
  });

  const subtotalBeforeDiscount = orderItems.reduce(
    (sum, li) => sum + li.lineTotalBeforeVat,
    0,
  );

  let extraGroupDiscountPercent = 0;
  let extraGroupDiscount = 0;

  if (
    isGroupBuy &&
    groupBuyRules["enabled"] &&
    toNumber(groupBuyRules["extraDiscountPercent"], 0) > 0
  ) {
    const joinedCount = toNumber(event["currentCount"] ?? event["buyCount"], 0);
    const minMembers = toNumber(groupBuyRules["minMembers"], 0);

    if (joinedCount >= minMembers && minMembers > 0) {
      extraGroupDiscountPercent = toNumber(
        groupBuyRules["extraDiscountPercent"],
        0,
      );
      extraGroupDiscount = Math.round(
        (subtotalBeforeDiscount * extraGroupDiscountPercent) / 100,
      );
    }
  }

  const subtotalAfterDiscount = subtotalBeforeDiscount - extraGroupDiscount;
  const vatAmount = Math.round(subtotalAfterDiscount * vatRate);
  const grandTotal = subtotalAfterDiscount + vatAmount;

  return {
    orderItems,
    subtotalBeforeDiscount,
    extraGroupDiscountPercent,
    extraGroupDiscount,
    subtotalAfterDiscount,
    vatRate,
    vatAmount,
    grandTotal,
  };
}
