export { toPercent, toVND } from "../../../shared/utils/price-utils";

export const calcEffectiveGroupPrice = (
  normalPrice: number,
  groupPrice?: number,
  groupDiscountPercent = 0,
): number | null => {
  if (groupPrice && groupPrice > 0) return groupPrice;
  if (groupDiscountPercent > 0)
    return Math.round(normalPrice * (1 - groupDiscountPercent / 100));
  return null;
};

export const calcProgressPercent = (
  current: number,
  threshold: number,
): number =>
  threshold > 0 ? Math.min(100, Math.round((current / threshold) * 100)) : 0;

import type {
  ProductPriceInfo,
  ProductPriceInput,
} from "../types/product-price-types";

export const calcPerProductPriceInfo = ({
  normalPrice,
  groupPrice,
  groupDiscountPercent = 0,
  qtyThreshold = 0,
  totalGroupQty = 0,
  currentMemberCount = 0,
  minMembers = 0,
  extraDiscountPercent = 0,
  userQty,
  isGroupBuy,
}: ProductPriceInput): ProductPriceInfo => {
  const hasFixedGroupPrice = isGroupBuy && !!groupPrice && groupPrice > 0;

  const basePrice = hasFixedGroupPrice ? (groupPrice as number) : normalPrice;

  const projectedTotalQty = totalGroupQty + userQty;
  const itemDiscountActive =
    isGroupBuy &&
    !hasFixedGroupPrice &&
    qtyThreshold > 0 &&
    projectedTotalQty >= qtyThreshold;
  const itemDiscountPercent = itemDiscountActive ? groupDiscountPercent : 0;

  const unitPriceAfterItemDiscount = Math.round(
    basePrice * (1 - itemDiscountPercent / 100),
  );
  const itemDiscountAmountPerUnit = basePrice - unitPriceAfterItemDiscount;

  const projectedMemberCount = currentMemberCount + 1;
  const willGetExtraDiscount =
    isGroupBuy && minMembers > 0 && projectedMemberCount >= minMembers;
  const extraPercent = willGetExtraDiscount ? extraDiscountPercent : 0;
  const proratedExtraDiscountPerUnit = Math.round(
    unitPriceAfterItemDiscount * (extraPercent / 100),
  );

  const finalUnitPrice =
    unitPriceAfterItemDiscount - proratedExtraDiscountPerUnit;
  const finalLineTotal = finalUnitPrice * userQty;
  const totalDiscountPercent = itemDiscountPercent + extraPercent;
  const savedAmountPerUnit = normalPrice - finalUnitPrice;

  return {
    originalPrice: normalPrice,
    basePrice,
    itemDiscountPercent,
    itemDiscountAmountPerUnit,
    extraDiscountPercent: extraPercent,
    proratedExtraDiscountPerUnit,
    finalUnitPrice,
    finalLineTotal,
    totalDiscountPercent,
    savedAmountPerUnit,
    willGetExtraDiscount,
    itemDiscountActive,
  };
};
