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

  currentMembers: number;
  minMembers: number;
  membersNeededForDiscount: number;
  willGetExtraDiscount: boolean;
  /** The configured extra-discount percent from discountRules (regardless of threshold) */
  potentialExtraDiscountPercent: number;
}

export interface GroupBuyToastItem {
  id: string;
  displayName: string;
  message: string;
  timestamp: number;
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
  isJoiningGroupBuy: boolean;
  orderId: string | null;
  pricingBreakdown: CheckoutPricingBreakdown | null;
  shareUrl: string;
  shareCopied: boolean;
  hasNativeShare: boolean;

  /** Real-time group buy data */
  liveMemberCount: number;
  groupBuyToasts: GroupBuyToastItem[];
  onDismissGroupBuyToast: (id: string) => void;

  onToggleGroupBuy: (value: boolean) => void | Promise<void>;
  onBackToDetail: () => void;
  onPlaceOrder: () => void;
  onCopyShareLink: () => void;
  onNativeShare: () => void;
}
