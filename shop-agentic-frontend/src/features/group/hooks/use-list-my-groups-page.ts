import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { APP_PATHS } from "../../../app/route-config";
import {
  fetchGroupByCode,
  fetchGroupShareLink,
  fetchMyGroups,
} from "../../../shared/services/group-api";
import { GROUP_STATUS_OPTIONS } from "../constants/list-my-groups-constants";
import {
  GroupItem,
  GroupModalType,
  GroupStatus,
  ListMyGroupsPageViewModel,
} from "../types/list-my-groups-types";
import { useGroupMutations } from "./use-group-mutations";

const isEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

const GROUP_PAGE = 1;
const GROUP_PAGE_SIZE = 100;

export const useListMyGroupsPage = (): ListMyGroupsPageViewModel => {
  const navigate = useNavigate();
  const redirectTimeoutRef = useRef<number | null>(null);

  const [search, setSearch] = useState("");
  const [debouncedCode, setDebouncedCode] = useState("");

  const [activeModal, setActiveModal] = useState<GroupModalType>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [createGroupName, setCreateGroupName] = useState<string>("");
  const [createGroupDescription, setCreateGroupDescription] =
    useState<string>("");
  const [memberEmail, setMemberEmail] = useState<string>("");
  const [statusDraft, setStatusDraft] = useState<GroupStatus>("active");
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<
    "info" | "success" | "warning" | "error"
  >("info");
  const [selectedGroupShareLink, setSelectedGroupShareLink] =
    useState<string>("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Debounce search for group-by-code lookup
  useEffect(() => {
    const normalizedSearch = search.trim().toUpperCase();

    if (!normalizedSearch) {
      setDebouncedCode("");
      return;
    }

    const timer = window.setTimeout(() => {
      setDebouncedCode(normalizedSearch);
    }, 260);

    return () => window.clearTimeout(timer);
  }, [search]);

  const {
    data: groupsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["myGroups", GROUP_PAGE, GROUP_PAGE_SIZE],
    queryFn: () => fetchMyGroups(GROUP_PAGE, GROUP_PAGE_SIZE),
  });

  const { data: foundGroup } = useQuery({
    queryKey: ["groupByCode", debouncedCode],
    queryFn: () => fetchGroupByCode(debouncedCode),
    enabled: !!debouncedCode,
    retry: false,
  });

  const isShareLinkModalOpen = activeModal === "share-link";

  const { data: fetchedShareLink } = useQuery({
    queryKey: ["groupShareLink", selectedGroupId],
    queryFn: () => fetchGroupShareLink(selectedGroupId),
    enabled: !!selectedGroupId && isShareLinkModalOpen,
  });

  useEffect(() => {
    if (fetchedShareLink) {
      setSelectedGroupShareLink(fetchedShareLink);
    }
  }, [fetchedShareLink]);

  const allGroups = useMemo(
    () =>
      (groupsData?.items ?? []).map(
        (group): GroupItem => ({
          id: group.id,
          name: String(group.name ?? "Untitled group"),
          description: String(group.description ?? ""),
          memberCount: Number(group.memberCount ?? 0),
          role: group.role === "owner" ? "owner" : "member",
          status: group.status === "paused" ? "paused" : "active",
          inviteCode: String(group.inviteCode ?? ""),
        }),
      ),
    [groupsData?.items],
  );

  const searchedGroupId = foundGroup?.id ?? null;

  const filteredGroups = useMemo(() => {
    const normalizedSearch = search.trim();

    if (!normalizedSearch) {
      return allGroups;
    }

    if (!searchedGroupId) {
      return [];
    }

    return allGroups.filter((group) => group.id === searchedGroupId);
  }, [allGroups, search, searchedGroupId]);

  const selectedGroup = useMemo(
    () => allGroups.find((group) => group.id === selectedGroupId) ?? null,
    [allGroups, selectedGroupId],
  );

  const {
    createGroupMutation,
    updateGroupSettingsMutation,
    addGroupMemberMutation,
    resetGroupCodeMutation,
  } = useGroupMutations({
    selectedGroupId,
    onShareLinkUpdate: setSelectedGroupShareLink,
  });

  const toGroupDetailPath = useCallback(
    (groupId: string) => APP_PATHS.groupDetail.replace(":groupId", groupId),
    [],
  );

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current !== null) {
        window.clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  const onSearchChange = useCallback((value: string) => {
    setSearch(value);
  }, []);

  const onOpenCreateModal = () => {
    setActiveModal("create");
  };

  const onOpenSettingsModal = (groupId: string) => {
    const targetGroup = allGroups.find((group) => group.id === groupId);

    if (!targetGroup) {
      return;
    }

    setSelectedGroupId(groupId);
    setStatusDraft(targetGroup.status);
    setActiveModal("settings");
  };

  const onOpenAddMemberModal = (groupId: string) => {
    setSelectedGroupId(groupId);
    setMemberEmail("");
    setActiveModal("add-member");
  };

  const onOpenShareLinkModal = (groupId: string) => {
    setSelectedGroupId(groupId);
    setSelectedGroupShareLink("");
    setActiveModal("share-link");
  };

  const onOpenGroupDetail = (groupId: string) => {
    navigate(toGroupDetailPath(groupId));
  };

  const onCloseModal = () => {
    setActiveModal(null);
    setSelectedGroupShareLink("");
  };

  const onCreateGroupNameChange = (value: string) => {
    setCreateGroupName(value);
  };

  const onCreateGroupDescriptionChange = (value: string) => {
    setCreateGroupDescription(value);
  };

  const onMemberEmailChange = (value: string) => {
    setMemberEmail(value);
  };

  const onStatusDraftChange = (value: GroupStatus) => {
    setStatusDraft(value);
  };

  const onCreateGroup = () => {
    const nextGroupName = createGroupName.trim();

    if (!nextGroupName) {
      setFeedbackTone("error");
      setFeedbackMessage("Group name is required.");
      return;
    }

    void (async () => {
      try {
        const createdGroup = await createGroupMutation.mutateAsync({
          name: nextGroupName,
          description: createGroupDescription.trim(),
        });

        setCreateGroupName("");
        setCreateGroupDescription("");
        setFeedbackMessage(null);
        setToastMessage(
          "Create group thành công. Đang chuyển đến group dashboard...",
        );
        setActiveModal(null);

        if (redirectTimeoutRef.current !== null) {
          window.clearTimeout(redirectTimeoutRef.current);
        }

        redirectTimeoutRef.current = window.setTimeout(() => {
          navigate(toGroupDetailPath(createdGroup.id));
        }, 900);
      } catch {
        setFeedbackTone("error");
        setFeedbackMessage("Failed to create group.");
      }
    })();
  };

  const onSaveSettings = () => {
    if (!selectedGroup) {
      return;
    }

    void (async () => {
      try {
        await updateGroupSettingsMutation.mutateAsync({
          groupId: selectedGroup.id,
          status: statusDraft,
        });

        setFeedbackTone("success");
        setFeedbackMessage(`Saved settings for ${selectedGroup.name}.`);
        setActiveModal(null);
      } catch {
        setFeedbackTone("error");
        setFeedbackMessage("Failed to update group settings.");
      }
    })();
  };

  const onAddMember = () => {
    const nextMemberEmail = memberEmail.trim();

    if (!selectedGroup || !isEmail(nextMemberEmail)) {
      setFeedbackTone("error");
      setFeedbackMessage("Please input a valid member email.");
      return;
    }

    void (async () => {
      try {
        const result = await addGroupMemberMutation.mutateAsync({
          groupId: selectedGroup.id,
          email: nextMemberEmail,
        });

        setMemberEmail("");
        setFeedbackTone(result.duplicated ? "info" : "success");
        setFeedbackMessage(
          result.duplicated
            ? `${nextMemberEmail} is already a member.`
            : `Invitation sent to ${nextMemberEmail}.`,
        );
        setActiveModal(null);
      } catch {
        setFeedbackTone("error");
        setFeedbackMessage("Failed to add member.");
      }
    })();
  };

  const onCopyShareLink = async () => {
    if (!selectedGroupShareLink) {
      return;
    }

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(selectedGroupShareLink);
        setFeedbackTone("success");
        setFeedbackMessage("Share link copied to clipboard.");
      } else {
        setFeedbackTone("info");
        setFeedbackMessage(selectedGroupShareLink);
      }
    } catch {
      setFeedbackTone("warning");
      setFeedbackMessage(
        "Unable to copy link automatically. Please copy it manually.",
      );
    }
  };

  const onResetGroupCode = async () => {
    if (!selectedGroup) {
      return;
    }

    try {
      await resetGroupCodeMutation.mutateAsync(selectedGroup.id);
      setFeedbackTone("success");
      setFeedbackMessage("Group code reset successfully.");
    } catch {
      setFeedbackTone("error");
      setFeedbackMessage("Failed to reset group code.");
    }
  };

  const onToastDismiss = () => {
    setToastMessage(null);
  };

  return {
    search,
    isLoading,
    error: error
      ? error instanceof Error
        ? error.message
        : "Failed to fetch groups"
      : null,
    groups: filteredGroups,
    feedbackMessage,
    feedbackTone,
    toastMessage,
    selectedGroup,
    selectedGroupShareLink,
    createGroupName,
    createGroupDescription,
    memberEmail,
    statusDraft,
    statusOptions: GROUP_STATUS_OPTIONS,
    isCreateModalOpen: activeModal === "create",
    isSettingsModalOpen: activeModal === "settings",
    isAddMemberModalOpen: activeModal === "add-member",
    isShareLinkModalOpen,
    onSearchChange,
    onOpenCreateModal,
    onOpenSettingsModal,
    onOpenAddMemberModal,
    onOpenShareLinkModal,
    onOpenGroupDetail,
    onCloseModal,
    onToastDismiss,
    onCreateGroupNameChange,
    onCreateGroupDescriptionChange,
    onMemberEmailChange,
    onStatusDraftChange,
    onCreateGroup,
    onSaveSettings,
    onAddMember,
    onCopyShareLink,
    onResetGroupCode,
  };
};
