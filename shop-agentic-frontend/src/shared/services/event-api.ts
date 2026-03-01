import type {
  GroupEventItem,
  GroupEventsResult,
  HostedEventItem,
  HostedEventsResult,
} from "../../features/event/types/event-list-types";
import type { ManageOrdersData } from "../../features/event/types/manage-orders-types";
import api from "./api";

export type {
  GroupEventItem,
  GroupEventsResult,
  HostedEventItem,
  HostedEventsResult,
  ManageOrdersData,
};

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
  groupToken?: string,
): Promise<Record<string, unknown>> => {
  const response = await api.get(
    `/events/${encodeURIComponent(eventId)}/detail`,
    groupToken ? { params: { groupToken } } : undefined,
  );

  const event = response.data?.data as Record<string, unknown> | undefined;

  if (typeof event?.id !== "string") {
    throw new Error("Event detail not found");
  }

  return event;
};

export const fetchGroupEvents = async (
  page: number,
  pageSize: number,
  search = "",
): Promise<GroupEventsResult> => {
  const response = await api.get("/events/my-feed", {
    params: { page, pageSize, search },
  });

  const items = (response.data?.data?.items ?? []) as GroupEventItem[];
  const total = Number(response.data?.data?.total ?? items.length);

  return { items, total };
};

export const reHostEvent = async (
  eventId: string,
): Promise<{ eventId: string; groupId: string }> => {
  const response = await api.post(
    `/events/${encodeURIComponent(eventId)}/re-host`,
  );
  return response.data?.data as { eventId: string; groupId: string };
};

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

/**
 * Fetch an encrypted share token that embeds the event's groupId.
 */
export const fetchGroupShareToken = async (
  eventId: string,
): Promise<string> => {
  const response = await api.get(
    `/events/${encodeURIComponent(eventId)}/group-share-token`,
  );

  const token = response.data?.data?.token;
  if (typeof token !== "string" || !token.trim()) {
    throw new Error("Failed to generate share token");
  }
  return token;
};

/**
 * Decrypt an encrypted share token back to the original groupId.
 */
export const resolveShareToken = async (token: string): Promise<string> => {
  const response = await api.get("/events/resolve-share-token", {
    params: { token },
  });

  const groupId = response.data?.data?.groupId;
  if (typeof groupId !== "string" || !groupId.trim()) {
    throw new Error("Invalid or expired share token");
  }
  return groupId;
};

// ─── Group-buy session ────────────────────────────────────────────────────────

export interface GroupBuySessionInfo {
  isHost: boolean;
  participantCount: number;
  sessionActive: boolean;
}

/**
 * Toggle "Mua nhóm" ON — joins (or creates) the active group-buy session.
 */
export const joinGroupBuySession = async (
  eventId: string,
): Promise<GroupBuySessionInfo> => {
  const response = await api.post(
    `/events/${encodeURIComponent(eventId)}/group-buy/join`,
  );
  return response.data?.data as GroupBuySessionInfo;
};

/**
 * Host-only: dissolve the group-buy session.
 */
export const dissolveGroupBuySession = async (
  eventId: string,
): Promise<void> => {
  await api.delete(`/events/${encodeURIComponent(eventId)}/group-buy/dissolve`);
};

/**
 * Non-host: leave the group-buy session.
 */
export const leaveGroupBuySession = async (eventId: string): Promise<void> => {
  await api.delete(`/events/${encodeURIComponent(eventId)}/group-buy/leave`);
};

/**
 * Record that the current user visited an event via a group share link.
 * Deduplicated on the backend (one visit per user).
 */
export const recordGroupVisit = async (
  eventId: string,
): Promise<{ alreadyVisited: boolean }> => {
  const response = await api.post(
    `/events/${encodeURIComponent(eventId)}/record-group-visit`,
  );
  return (response.data?.data ?? { alreadyVisited: false }) as {
    alreadyVisited: boolean;
  };
};
