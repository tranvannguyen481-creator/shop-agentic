import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  addGroupMember,
  createGroup,
  resetGroupCode,
  updateGroupSettings,
} from "../../../shared/services/group-api";

interface UseGroupMutationsOptions {
  selectedGroupId: string;
  onShareLinkUpdate: (shareLink: string) => void;
}

export const useGroupMutations = ({
  selectedGroupId,
  onShareLinkUpdate,
}: UseGroupMutationsOptions) => {
  const queryClient = useQueryClient();

  const createGroupMutation = useMutation({
    mutationFn: (payload: { name: string; description: string }) =>
      createGroup(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["myGroups"] });
    },
  });

  const updateGroupSettingsMutation = useMutation({
    mutationFn: ({
      groupId,
      status,
    }: {
      groupId: string;
      status: "active" | "paused";
    }) => updateGroupSettings(groupId, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["myGroups"] });
    },
  });

  const addGroupMemberMutation = useMutation({
    mutationFn: ({ groupId, email }: { groupId: string; email: string }) =>
      addGroupMember(groupId, email),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["myGroups"] });
    },
  });

  const resetGroupCodeMutation = useMutation({
    mutationFn: (groupId: string) => resetGroupCode(groupId),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ["myGroups"] });
      void queryClient.invalidateQueries({
        queryKey: ["groupShareLink", selectedGroupId],
      });
      onShareLinkUpdate(result.shareLink);
    },
  });

  return {
    createGroupMutation,
    updateGroupSettingsMutation,
    addGroupMemberMutation,
    resetGroupCodeMutation,
  };
};
