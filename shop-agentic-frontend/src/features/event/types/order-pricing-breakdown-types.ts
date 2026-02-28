import { CheckoutPricingBreakdown } from "./event-checkout-page-types";

export interface OrderPricingBreakdownProps {
  breakdown: CheckoutPricingBreakdown;
  isGroupBuy: boolean;
  isLoading?: boolean;
}
