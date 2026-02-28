export interface GroupBuyPriceTagProps {
  normalPrice: number;
  groupPrice?: number;
  groupDiscountPercent?: number;
  qtyThreshold?: number;
  
  currentGroupQty?: number;
}
