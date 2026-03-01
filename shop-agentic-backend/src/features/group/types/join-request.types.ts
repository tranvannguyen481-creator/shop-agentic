export const JOIN_REQUEST_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

export type JoinRequestStatus =
  (typeof JOIN_REQUEST_STATUS)[keyof typeof JOIN_REQUEST_STATUS];

export interface JoinRequestItem {
  id: string;
  groupId: string;
  uid: string;
  email: string;
  displayName: string;
  status: JoinRequestStatus;
  eventId: string;
  createdAt: number;
  updatedAt: number;
}
