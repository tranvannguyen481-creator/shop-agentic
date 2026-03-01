export interface HostedEventItem {
  id: string;
  title?: string;
  description?: string;
  closingDate?: string;
  collectionDate?: string;
  buyCount?: number;
  adminFee?: string;
  status?: string;
  closingInText?: string;
  deliveryInText?: string;
  hostDisplayName?: string;
  bannerPreviewUrls?: string[];
}

export interface HostedEventsResult {
  items: HostedEventItem[];
  total: number;
}

export interface GroupEventItem {
  id: string;
  title?: string;
  description?: string;
  closingDate?: string;
  collectionDate?: string;
  buyCount?: number;
  adminFee?: string;
  status?: string;
  closingInText?: string;
  deliveryInText?: string;
  groupId?: string;
  groupName?: string;
  hostDisplayName?: string;
  bannerPreviewUrls?: string[];
}

export interface GroupEventsResult {
  items: GroupEventItem[];
  total: number;
}
