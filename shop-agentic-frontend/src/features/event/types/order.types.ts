// Order type constants
export const ORDER_TYPE = {
  INDIVIDUAL: "individual",
  GROUP: "group",
} as const;

export const ORDER_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  SHIPPED: "shipped",
  CANCELLED: "cancelled",
} as const;

export const PAYMENT_METHOD = {
  MOMO: "momo",
  VNPAY: "vnpay",
  ZALOPAY: "zalopay",
  COD: "cod",
} as const;

export type OrderType = (typeof ORDER_TYPE)[keyof typeof ORDER_TYPE];
export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];
export type PaymentMethod =
  (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD];

// ─── Request Types ─────────────────────────────────────────────────────────

export interface OrderItemInput {
  productId: string;
  qty: number;
  selectedOptionIds?: string[];
}

export interface CalculateOrderRequest {
  eventId: string;
  items: OrderItemInput[];
  isGroupBuy: boolean;
}

export interface PlaceOrderRequest extends CalculateOrderRequest {
  paymentMethod?: PaymentMethod;
  deliveryAddress?: string;
  note?: string;
}

// ─── Response Types ────────────────────────────────────────────────────────

export interface OrderLineItem {
  productId: string;
  productName: string;
  qty: number;
  normalPrice: number;
  basePrice: number;
  itemDiscountPercent: number;
  discountAmount: number;
  discountedUnitPrice: number;
  lineTotalBeforeVat: number;
}

export interface OrderBreakdown {
  subtotalBeforeDiscount: number;
  extraGroupDiscountPercent: number;
  totalDiscount: number;
  subtotalAfterDiscount: number;
  vatRate: number;
  vatAmount: number;
  grandTotal: number;
}

export interface CalculateOrderResult extends OrderBreakdown {
  eventId: string;
  isGroupBuy: boolean;
  orderItems: OrderLineItem[];
  // Realtime group progress
  currentMembers: number;
  minMembers: number;
  membersNeededForDiscount: number;
  willGetExtraDiscount: boolean;
}

export interface PlaceOrderResult {
  orderId: string;
  grandTotal: number;
  breakdown: OrderBreakdown;
  items: OrderLineItem[];
  status: OrderStatus;
}

export interface OrderDetail {
  id: string;
  userUid: string;
  userDisplayName?: string;
  eventId: string;
  groupId?: string;
  type: OrderType;
  items: OrderLineItem[];
  subtotalBeforeDiscount: number;
  extraGroupDiscountPercent: number;
  totalDiscount: number;
  subtotalAfterDiscount: number;
  vatRate: number;
  vatAmount: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  deliveryAddress?: string;
  note?: string;
  status: OrderStatus;
  createdAt: number;
  updatedAt: number;
}

export interface ListOrdersResult {
  items: OrderDetail[];
  total: number;
  page: number;
  pageSize: number;
}

// ─── Event Product with Pricing ───────────────────────────────────────────

export interface EventProduct {
  id: string;
  name: string;
  description?: string;
  normalPrice: number;
  basePrice: number;
  price: string; // formatted "$X.XX"
  groupPrice?: number;
  groupDiscountPercent?: number;
  qtyThreshold?: number;
  stock?: number;
  imagePreviewUrl?: string;
}

export interface EventDiscountRules {
  groupBuy: {
    enabled: boolean;
    minMembers: number;
    extraDiscountPercent: number;
  };
}
