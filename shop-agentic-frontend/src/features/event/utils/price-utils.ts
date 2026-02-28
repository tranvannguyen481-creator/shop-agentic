export const toVND = (value: number): string =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
  }).format(Math.round(value));

export const toPercent = (value: number): string =>
  `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`;

/**
 * Tính giá nhóm hiệu lực cho 1 sản phẩm.
 * Ưu tiên: groupPrice (host nhập tay) > normalPrice * (1 - groupDiscountPercent%) > null
 */
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

/**
 * Tính phần trăm progress (0–100) của qty hiện tại so với ngưỡng.
 */
export const calcProgressPercent = (
  current: number,
  threshold: number,
): number =>
  threshold > 0 ? Math.min(100, Math.round((current / threshold) * 100)) : 0;

/**
 * Tính đầy đủ thông tin giá của 1 sản phẩm dành riêng cho 1 user.
 *
 * Công thức (theo spec v1.1):
 *  1. basePrice = groupPrice (cố định) hoặc normalPrice (nếu dùng % threshold)
 *  2. itemDiscountPercent = groupDiscountPercent nếu projectedQty ≥ qtyThreshold và isGroupBuy
 *  3. unitPriceAfterItemDiscount = round(basePrice × (1 - itemDiscountPercent%))
 *  4. extraPercent = extraDiscountPercent nếu projectedMembers ≥ minMembers và isGroupBuy
 *  5. finalUnitPrice = unitPriceAfterItemDiscount − round(unitPriceAfterItemDiscount × extraPercent%)
 *
 * Quan trọng: giá hiển thị trên UI chỉ là ƯỚC TÍNH realtime.
 * Server sẽ tính lại và lock giá khi user đặt hàng.
 */
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

  // Bước 1: basePrice
  // Nếu host nhập groupPrice cố định → dùng luôn (không qua threshold)
  // Ngược lại giữ normalPrice; discount sẽ áp qua itemDiscountPercent ở bước 2-3
  const basePrice = hasFixedGroupPrice ? (groupPrice as number) : normalPrice;

  // Bước 2: item-level discount (qtyThreshold gating)
  // Chỉ áp khi: mua nhóm + KHÔNG có groupPrice cố định + threshold > 0 + đã đủ qty
  const projectedTotalQty = totalGroupQty + userQty;
  const itemDiscountActive =
    isGroupBuy &&
    !hasFixedGroupPrice &&
    qtyThreshold > 0 &&
    projectedTotalQty >= qtyThreshold;
  const itemDiscountPercent = itemDiscountActive ? groupDiscountPercent : 0;

  // Bước 3: giá sau item discount
  const unitPriceAfterItemDiscount = Math.round(
    basePrice * (1 - itemDiscountPercent / 100),
  );
  const itemDiscountAmountPerUnit = basePrice - unitPriceAfterItemDiscount;

  // Bước 4: extra group discount (order-level, gated bởi minMembers)
  // +1 để tính cả user hiện tại sắp join
  const projectedMemberCount = currentMemberCount + 1;
  const willGetExtraDiscount =
    isGroupBuy && minMembers > 0 && projectedMemberCount >= minMembers;
  const extraPercent = willGetExtraDiscount ? extraDiscountPercent : 0;
  const proratedExtraDiscountPerUnit = Math.round(
    unitPriceAfterItemDiscount * (extraPercent / 100),
  );

  // Bước 5: giá cuối cùng
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
