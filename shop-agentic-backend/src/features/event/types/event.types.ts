export const EVENT_STATUS = {
  ACTIVE: "active",
  CLOSED: "closed",
  DRAFT: "draft",
} as const;

export type EventStatus = (typeof EVENT_STATUS)[keyof typeof EVENT_STATUS];

export interface EventListItem {
  id: string;
  title: string;
  description: string;
  closingDate: string;
  collectionDate: string;
  closingInText: string;
  deliveryInText: string;
  buyCount: number;
  totalPurchase: string;
  adminFee: string;
  status: EventStatus;
  userId: string;
  hostUid: string;
  hostDisplayName: string;
  updatedAt: number | null;
  bannerPreviewUrls: string[];
}

export interface GroupEventListItem {
  id: string;
  title: string;
  description: string;
  closingDate: string;
  collectionDate: string;
  closingInText: string;
  deliveryInText: string;
  buyCount: number;
  totalPurchase: string;
  adminFee: string;
  status: EventStatus;
  groupId: string;
  groupName: string;
  hostDisplayName: string;
  updatedAt: number | null;
}

export interface OptionChoice {
  id: string;
  name: string;
  price: number;
}

export interface OptionGroup {
  id: string;
  name: string;
  required: boolean;
  choices: OptionChoice[];
}

export interface EventProductItem {
  id: string;
  name: string;
  description: string;
  normalPrice: number;
  basePrice: number;
  price: string;
  groupPrice: number;
  groupDiscountPercent: number;
  qtyThreshold: number;
  stock: number;
  totalGroupQty: number;
  imagePreviewUrl: string;
  options: string[];
  optionGroups: OptionGroup[];
}
