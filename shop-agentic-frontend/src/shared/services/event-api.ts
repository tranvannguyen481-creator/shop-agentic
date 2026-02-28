import api from "./api";

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
  [key: string]: unknown;
}

export interface HostedEventsResult {
  items: HostedEventItem[];
  total: number;
}

export const fetchHostedEvents = async (
  page: number,
  pageSize: number,
): Promise<HostedEventsResult> => {
  const response = await api.get("/events/my-hosted", {
    params: { page, pageSize },
  });

  const items = (response.data?.data?.items ?? []) as HostedEventItem[];
  const total = Number(response.data?.data?.total ?? items.length);

  return { items, total };
};

export const fetchEventDetail = async (
  eventId: string,
): Promise<Record<string, unknown>> => {
  const response = await api.get(
    `/events/${encodeURIComponent(eventId)}/detail`,
  );

  const event = response.data?.data as Record<string, unknown> | undefined;

  if (typeof event?.id !== "string") {
    throw new Error("Event detail not found");
  }

  return event;
};

export interface ManageOrdersData {
  title: string;
  closingDate: string;
  collectionDate: string;
  closingInText: string;
  deliveryInText: string;
  buyCount: number;
  totalPurchase: string;
  adminFee: string;
}

export const fetchManageOrdersData = async (
  eventId: string,
): Promise<ManageOrdersData> => {
  const response = await api.get(
    `/events/${encodeURIComponent(eventId)}/manage-orders`,
  );

  const data = response.data?.data as ManageOrdersData | undefined;

  if (!data) {
    throw new Error("Failed to fetch manage orders data");
  }

  return data;
};
