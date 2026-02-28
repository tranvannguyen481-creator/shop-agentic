export const ORDER_TYPE = {
  INDIVIDUAL: "individual",
  GROUP: "group",
} as const;
export type OrderType = (typeof ORDER_TYPE)[keyof typeof ORDER_TYPE];

export const ORDER_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  SHIPPED: "shipped",
  CANCELLED: "cancelled",
} as const;
export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export const PAYMENT_METHOD = {
  MOMO: "momo",
  VNPAY: "vnpay",
  ZALOPAY: "zalopay",
  COD: "cod",
} as const;
export type PaymentMethod =
  (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD];

// ─── Shared Interfaces ───────────────────────────────────────────────────────

export interface LineItem {
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
  orderItems: LineItem[];
  subtotalBeforeDiscount: number;
  extraGroupDiscountPercent: number;
  extraGroupDiscount: number;
  subtotalAfterDiscount: number;
  vatRate: number;
  vatAmount: number;
  grandTotal: number;
}

export interface OrderDocument {
  id: string;
  userUid: string;
  userEmail: string;
  userDisplayName: string;
  eventId: string;
  groupId: string;
  type: OrderType;
  items: LineItem[];
  subtotalBeforeDiscount: number;
  extraGroupDiscountPercent: number;
  totalDiscount: number;
  subtotalAfterDiscount: number;
  vatRate: number;
  vatAmount: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  deliveryAddress: string;
  note: string;
  status: OrderStatus;
  createdAt: number;
  updatedAt: number;
}
