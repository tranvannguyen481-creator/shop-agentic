import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { APP_PATHS } from "../../../app/route-config";
import { useCurrentUserQuery } from "../../../shared/hooks/use-current-user-query";
import { fetchGroupDetail } from "../../../shared/services/group-api";

type GroupDashboardMode = "admin-mobile" | "premium";

const toReadableDate = (value: unknown) => {
  const timestamp = Number(value);

  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    return "-";
  }

  try {
    return new Date(timestamp).toLocaleString();
  } catch {
    return "-";
  }
};

export const useGroupDetailPage = () => {
  const navigate = useNavigate();
  const params = useParams<{ groupId: string }>();
  const groupId = params.groupId?.trim() ?? "";
  const [mode, setMode] = useState<GroupDashboardMode>("admin-mobile");

  const {
    data: group,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["groupDetail", groupId],
    queryFn: () => fetchGroupDetail(groupId),
    enabled: !!groupId,
  });

  const { data: currentUser } = useCurrentUserQuery();

  const canUsePremiumLayout = useMemo(() => {
    const role = String(currentUser?.role ?? "").toLowerCase();
    const tier = String(currentUser?.subscriptionTier ?? "").toLowerCase();
    const status = String(currentUser?.subscriptionStatus ?? "").toLowerCase();
    const isPro = Boolean(currentUser?.isPremium);

    return (
      isPro ||
      role.includes("premium") ||
      tier.includes("premium") ||
      status === "active"
    );
  }, [currentUser]);

  useMemo(() => {
    if (!canUsePremiumLayout && mode === "premium") {
      setMode("admin-mobile");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUsePremiumLayout]);

  const dashboardCards = useMemo(
    () => [
      {
        label: "Members",
        value: String(Number(group?.memberCount ?? 0)),
      },
      {
        label: "Status",
        value: String(group?.status ?? "active"),
      },
      {
        label: "Invite code",
        value: String(group?.inviteCode ?? "-"),
      },
    ],
    [group?.inviteCode, group?.memberCount, group?.status],
  );

  const premiumCards = useMemo(
    () => [
      {
        label: "Premium member",
        value: canUsePremiumLayout ? "Enabled" : "Locked",
      },
      {
        label: "Owner",
        value: String(group?.ownerDisplayName ?? "-").slice(0, 18),
      },
      {
        label: "Last update",
        value: toReadableDate(group?.updatedAt),
      },
    ],
    [canUsePremiumLayout, group?.ownerDisplayName, group?.updatedAt],
  );

  const onSelectMode = (nextMode: GroupDashboardMode) => {
    if (nextMode === "premium" && !canUsePremiumLayout) {
      return;
    }

    setMode(nextMode);
  };

  return {
    groupId,
    groupName: String(group?.name ?? "Group"),
    description: String(group?.description ?? "No description"),
    ownerDisplayName: String(group?.ownerDisplayName ?? "-"),
    ownerEmail: String((group as Record<string, unknown>)?.ownerEmail ?? "-"),
    createdAtText: toReadableDate(
      (group as Record<string, unknown>)?.createdAt,
    ),
    updatedAtText: toReadableDate(group?.updatedAt),
    status: String(group?.status ?? "active"),
    memberCount: String(Number(group?.memberCount ?? 0)),
    inviteCode: String(group?.inviteCode ?? "-"),
    isPremiumMode: mode === "premium",
    isLoading,
    error: error
      ? error instanceof Error
        ? error.message
        : "Failed to fetch group"
      : null,
    mode,
    canUsePremiumLayout,
    dashboardCards,
    premiumCards,
    onSelectMode,
    onBack: () => navigate(APP_PATHS.listMyGroups),
    onBackToGroups: () => navigate(APP_PATHS.listMyGroups),
  };
};
