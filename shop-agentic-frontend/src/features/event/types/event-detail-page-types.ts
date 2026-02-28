export interface EventDetailProductOptionChoice {
  id: string;
  name: string;
  price: number;
}

export interface EventDetailProductOptionGroup {
  id: string;
  name: string;
  required: boolean;
  choices: EventDetailProductOptionChoice[];
}

export interface EventDetailProductItem {
  id: string;
  name: string;
  description: string;
  /** Giá mua lẻ (VND) */
  normalPrice: number;
  basePrice: number;
  price: string;
  /** Giá mua nhóm cố định (nếu host nhập tay) */
  groupPrice?: number;
  /** % giảm thêm khi mua nhóm */
  groupDiscountPercent?: number;
  /** Ngưỡng qty toàn nhóm để kích hoạt groupDiscountPercent */
  qtyThreshold?: number;
  /** Tồn kho (0 = không giới hạn) */
  stock?: number;
  /** [Realtime] Tổng qty sản phẩm này đã được mua bởi toàn nhóm */
  totalGroupQty: number;
  imagePreviewUrl: string;
  options: string[];
  optionGroups: EventDetailProductOptionGroup[];
}

export interface EventDetailCartLineItem {
  lineId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  selectedChoices: EventDetailProductOptionChoice[];
}

export interface EventProductOrderFormValues {
  quantity: number;
  requiredSelections: Record<string, string>;
}

export interface EventAddToOrderPayload {
  product: EventDetailProductItem;
  quantity: number;
  selectedChoiceIds: string[];
}

export interface EventDetailPageViewModel {
  eventId: string;
  title: string;
  description: string;
  closingInText: string;
  closingDate: string;
  collectionDate: string;
  collectionTime: string;
  pickupLocation: string;
  importantNotes: string[];
  bannerPreviewUrl: string;
  hostDisplayName: string;
  joinedCount: number;
  adminFeeText: string;
  status: string;
  isClosed: boolean;
  groupId: string;
  groupName: string;
  products: EventDetailProductItem[];
  orderItemCount: number;
  canProceedCheckout: boolean;
  infoMessage: string | null;
  isLoading: boolean;
  isReHosting: boolean;
  error: string | null;
  /** VAT rate của event (mặc định 0.10 = 10%) */
  vatRate: number;
  /** Quy tắc giảm giá group buy */
  discountRules: {
    groupBuy: {
      enabled: boolean;
      minMembers: number;
      extraDiscountPercent: number;
    };
  };
  /** Số member hiện tại đã join event */
  currentMembers: number;
  onAddToOrder: (payload: EventAddToOrderPayload) => void;
  onProceedCheckout: () => void;
  onBackToEvents: () => void;
  onReHost: () => void;
}
