import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  approveJoinRequest,
  fetchJoinRequests,
  rejectJoinRequest,
  type JoinRequestItem,
} from "../../../shared/services/group-api";

export const joinRequestsQueryKey = (groupId: string) =>
  ["joinRequests", groupId] as const;

export interface UseJoinRequestsResult {
  items: JoinRequestItem[];
  isLoading: boolean;
  error: string | null;
  onApprove: (requestId: string) => void;
  onReject: (requestId: string) => void;
  approvingId: string | null;
  rejectingId: string | null;
}

export function useJoinRequests(
  groupId: string,
  enabled: boolean,
): UseJoinRequestsResult {
  const queryClient = useQueryClient();
  const queryKey = joinRequestsQueryKey(groupId);

  const {
    data: items = [],
    isLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn: () => fetchJoinRequests(groupId),
    enabled: !!groupId && enabled,
    refetchInterval: 15_000,
  });

  const approveMutation = useMutation({
    mutationFn: (requestId: string) => approveJoinRequest(groupId, requestId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
      void queryClient.invalidateQueries({
        queryKey: ["groupDetail", groupId],
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (requestId: string) => rejectJoinRequest(groupId, requestId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    items,
    isLoading,
    error: error
      ? error instanceof Error
        ? error.message
        : "Failed to load join requests"
      : null,
    onApprove: (requestId: string) => approveMutation.mutate(requestId),
    onReject: (requestId: string) => rejectMutation.mutate(requestId),
    approvingId: approveMutation.isPending
      ? (approveMutation.variables ?? null)
      : null,
    rejectingId: rejectMutation.isPending
      ? (rejectMutation.variables ?? null)
      : null,
  };
}
