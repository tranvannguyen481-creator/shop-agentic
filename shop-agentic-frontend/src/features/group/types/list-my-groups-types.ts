export type GroupRole = "owner" | "member";

export type GroupStatus = "active" | "paused";

export type GroupModalType =
  | "create"
  | "settings"
  | "add-member"
  | "share-link"
  | null;

export interface GroupItem {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  role: GroupRole;
  status: GroupStatus;
  inviteCode: string;
  ownerDisplayName?: string;
  ownerEmail?: string;
}

export interface GroupStatusOption {
  label: string;
  value: GroupStatus;
}

export interface ListMyGroupsPageViewModel {
  search: string;
  isLoading: boolean;
  error: string | null;
  groups: GroupItem[];
  feedbackMessage: string | null;
  feedbackTone: "info" | "success" | "warning" | "error";
  toastMessage: string | null;
  selectedGroup: GroupItem | null;
  selectedGroupShareLink: string;
  createGroupName: string;
  createGroupDescription: string;
  memberEmail: string;
  statusDraft: GroupStatus;
  statusOptions: GroupStatusOption[];
  isCreateModalOpen: boolean;
  isSettingsModalOpen: boolean;
  isAddMemberModalOpen: boolean;
  isShareLinkModalOpen: boolean;
  onSearchChange: (value: string) => void;
  onOpenCreateModal: () => void;
  onOpenSettingsModal: (groupId: string) => void;
  onOpenAddMemberModal: (groupId: string) => void;
  onOpenShareLinkModal: (groupId: string) => void;
  onOpenGroupDetail: (groupId: string) => void;
  onCloseModal: () => void;
  onToastDismiss: () => void;
  onCreateGroupNameChange: (value: string) => void;
  onCreateGroupDescriptionChange: (value: string) => void;
  onMemberEmailChange: (value: string) => void;
  onStatusDraftChange: (value: GroupStatus) => void;
  onCreateGroup: () => void;
  onSaveSettings: () => void;
  onAddMember: () => void;
  onCopyShareLink: () => Promise<void>;
  onResetGroupCode: () => Promise<void>;
}
