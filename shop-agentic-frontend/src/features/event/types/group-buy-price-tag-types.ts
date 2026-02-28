export interface GroupBuyPriceTagProps {
  normalPrice: number;
  groupPrice?: number;
  groupDiscountPercent?: number;
  qtyThreshold?: number;
  /** Tổng qty group đã mua để hiển thị progress tới ngưỡng */
  currentGroupQty?: number;
}
