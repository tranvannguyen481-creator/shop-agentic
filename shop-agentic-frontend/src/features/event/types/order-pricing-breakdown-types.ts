import { CheckoutPricingBreakdown } from "./event-checkout-page-types";

export interface OrderPricingBreakdownProps {
  breakdown: CheckoutPricingBreakdown;
  isGroupBuy: boolean;
  isLoading?: boolean;
  /** Real-time member count from Firestore; overrides breakdown.currentMembers when higher */
  liveMemberCount?: number;
}
