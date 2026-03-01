import type {
  GroupDetail,
  GroupItem,
  GroupRole,
  GroupStatus,
} from "../../features/group/types/list-my-groups-types";
import api from "./api";

export type { GroupDetail, GroupItem, GroupRole, GroupStatus };

export interface MyGroupsResult {
  items: GroupItem[];
  total: number;
}

export const fetchMyGroups = async (
  page: number,
  pageSize: number,
): Promise<MyGroupsResult> => {
  const response = await api.get("/groups/my", {
    params: { page, pageSize },
  });

  const items = (response.data?.data?.items ?? []) as GroupItem[];
  const total = Number(response.data?.data?.total ?? items.length);

  return { items, total };
};

export const fetchGroupDetail = async (
  groupId: string,
): Promise<GroupDetail> => {
  const response = await api.get(`/groups/${groupId}`);
  const group = response.data?.data as GroupDetail | undefined;

  if (typeof group?.id !== "string") {
    throw new Error("Group detail not found");
  }

  return group;
};

export const fetchGroupByCode = async (
  inviteCode: string,
): Promise<GroupItem> => {
  const normalizedCode = inviteCode.trim().toUpperCase();
  const response = await api.get(
    `/groups/code/${encodeURIComponent(normalizedCode)}`,
  );

  const group = response.data?.data as GroupItem | undefined;

  if (typeof group?.id !== "string") {
    throw new Error("Group not found");
  }

  return group;
};

export const fetchGroupShareLink = async (groupId: string): Promise<string> => {
  const response = await api.get(`/groups/${groupId}/share-link`);
  const shareLink = response.data?.data?.shareLink;

  if (typeof shareLink !== "string") {
    throw new Error("Failed to fetch share link");
  }

  return shareLink;
};

export const createGroup = async (payload: {
  name: string;
  description: string;
}): Promise<GroupItem> => {
  const response = await api.post("/groups", payload);
  const group = response.data?.data as GroupItem | undefined;

  if (typeof group?.id !== "string") {
    throw new Error("Failed to create group");
  }

  return group;
};

export const updateGroupSettings = async (
  groupId: string,
  status: "active" | "paused",
): Promise<GroupItem> => {
  const response = await api.patch(`/groups/${groupId}/settings`, { status });
  const group = response.data?.data as GroupItem | undefined;

  if (typeof group?.id !== "string") {
    throw new Error("Failed to update group settings");
  }

  return group;
};

export interface AddGroupMemberResult {
  duplicated: boolean;
  group?: GroupItem;
}

export const addGroupMember = async (
  groupId: string,
  email: string,
): Promise<AddGroupMemberResult> => {
  const response = await api.post(`/groups/${groupId}/members`, { email });
  const payload = response.data?.data as AddGroupMemberResult | undefined;

  return {
    duplicated: Boolean(payload?.duplicated),
    group: payload?.group,
  };
};

export interface ResetGroupCodeResult {
  inviteCode: string;
  shareLink: string;
}

export const resetGroupCode = async (
  groupId: string,
): Promise<ResetGroupCodeResult> => {
  const response = await api.patch(`/groups/${groupId}/reset-code`);

  return {
    inviteCode: String(response.data?.data?.inviteCode ?? ""),
    shareLink: String(response.data?.data?.shareLink ?? ""),
  };
};

// ─── Join Request API ─────────────────────────────────────────────────────────

export interface RequestJoinGroupResult {
  requestId: string;
  alreadyRequested: boolean;
}

export const requestJoinGroup = async (
  groupId: string,
  eventId: string,
): Promise<RequestJoinGroupResult> => {
  const response = await api.post(`/groups/${groupId}/join-requests`, {
    eventId,
  });

  const data = response.data?.data as RequestJoinGroupResult | undefined;

  return {
    requestId: String(data?.requestId ?? ""),
    alreadyRequested: Boolean(data?.alreadyRequested),
  };
};

// ─── Join Request Management API ──────────────────────────────────────────────

export interface JoinRequestItem {
  id: string;
  groupId: string;
  uid: string;
  email: string;
  displayName: string;
  status: "pending" | "approved" | "rejected";
  eventId: string;
  createdAt: number;
  updatedAt: number;
}

export const fetchJoinRequests = async (
  groupId: string,
): Promise<JoinRequestItem[]> => {
  const response = await api.get(`/groups/${groupId}/join-requests`);
  const items = response.data?.data?.items as JoinRequestItem[] | undefined;
  return Array.isArray(items) ? items : [];
};

export const approveJoinRequest = async (
  groupId: string,
  requestId: string,
): Promise<void> => {
  await api.patch(`/groups/${groupId}/join-requests/${requestId}/approve`);
};

export const rejectJoinRequest = async (
  groupId: string,
  requestId: string,
): Promise<void> => {
  await api.patch(`/groups/${groupId}/join-requests/${requestId}/reject`);
};
