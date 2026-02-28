
export interface ProductPriceInput {
  
  normalPrice: number;
  
  groupPrice?: number;
  
  groupDiscountPercent?: number;
  
  qtyThreshold?: number;
  
  totalGroupQty?: number;
  
  currentMemberCount?: number;
  
  minMembers?: number;
  
  extraDiscountPercent?: number;
  
  userQty: number;
  
  isGroupBuy: boolean;
}

export interface ProductPriceInfo {
  
  originalPrice: number;
  
  basePrice: number;
  
  itemDiscountPercent: number;
  
  itemDiscountAmountPerUnit: number;
  
  extraDiscountPercent: number;
  
  proratedExtraDiscountPerUnit: number;
  
  finalUnitPrice: number;
  
  finalLineTotal: number;
  
  totalDiscountPercent: number;
  
  savedAmountPerUnit: number;
  
  willGetExtraDiscount: boolean;
  
  itemDiscountActive: boolean;
}
