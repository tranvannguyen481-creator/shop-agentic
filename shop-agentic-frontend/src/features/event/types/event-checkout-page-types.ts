export interface EventCheckoutLineItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  basePrice: number;
  normalPrice?: number;
  selectedChoices: string[];
}

export interface CheckoutPricingBreakdown {
  subtotalBeforeDiscount: number;
  extraGroupDiscountPercent: number;
  totalDiscount: number;
  subtotalAfterDiscount: number;
  vatRate: number;
  vatAmount: number;
  grandTotal: number;
  // Group buy progress
  currentMembers: number;
  minMembers: number;
  membersNeededForDiscount: number;
  willGetExtraDiscount: boolean;
}

export interface EventCheckoutPageViewModel {
  eventId: string;
  items: EventCheckoutLineItem[];
  itemCount: number;
  subtotalText: string;
  hasItems: boolean;
  infoMessage: string | null;
  errorMessage: string | null;
  isGroupBuy: boolean;
  isCalculating: boolean;
  isPlacingOrder: boolean;
  orderId: string | null; // set after success
  pricingBreakdown: CheckoutPricingBreakdown | null;
  onToggleGroupBuy: (value: boolean) => void;
  onBackToDetail: () => void;
  onPlaceOrder: () => void;
}
