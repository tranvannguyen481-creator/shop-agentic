export const GROUP_STATUS = {
  ACTIVE: "active",
  PAUSED: "paused",
} as const;

export const GROUP_ROLE = {
  OWNER: "owner",
  MEMBER: "member",
} as const;

export type GroupStatus = (typeof GROUP_STATUS)[keyof typeof GROUP_STATUS];
export type GroupRole = (typeof GROUP_ROLE)[keyof typeof GROUP_ROLE];

export interface GroupListItem {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  status: GroupStatus;
  role: GroupRole;
  inviteCode: string;
  updatedAt: number;
}

export interface GroupDetail extends GroupListItem {
  ownerUid: string;
  ownerDisplayName: string;
  ownerEmail: string;
  memberEmails: string[];
  memberUids: string[];
  createdAt: number;
}
