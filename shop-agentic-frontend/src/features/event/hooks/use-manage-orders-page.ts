import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { APP_PATHS } from "../../../app/route-config";
import { fetchManageOrdersData } from "../../../shared/services/event-api";
import { ManageOrdersViewModel } from "../types/manage-orders-types";

export const useManageOrdersPage = (): ManageOrdersViewModel => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isCloseOrderModalOpen, setIsCloseOrderModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const eventId = useMemo(() => {
    const value = searchParams.get("eventId");
    return value?.trim() ?? "";
  }, [searchParams]);

  const { data, isLoading } = useQuery({
    queryKey: ["manageOrders", eventId],
    queryFn: () => fetchManageOrdersData(eventId),
    enabled: !!eventId,
  });

  return {
    eventId,
    isLoading,
    data: data ?? null,
    hasOrders: Number(data?.buyCount ?? 0) > 0,
    isCloseOrderModalOpen,
    isDeleteModalOpen,
    infoMessage,
    handleEditEvent: () => {
      if (!eventId) {
        return;
      }

      navigate(`${APP_PATHS.updateEvent}?id=${encodeURIComponent(eventId)}`);
    },
    handleOpenCloseOrderModal: () => {
      setIsCloseOrderModalOpen(true);
    },
    handleCloseCloseOrderModal: () => {
      setIsCloseOrderModalOpen(false);
    },
    handleConfirmCloseOrder: () => {
      setIsCloseOrderModalOpen(false);
      setInfoMessage(
        "Order closing flow is prepared. Backend action can be connected next.",
      );
    },
    handleOpenDeleteModal: () => {
      setIsDeleteModalOpen(true);
    },
    handleCloseDeleteModal: () => {
      setIsDeleteModalOpen(false);
    },
    handleConfirmDelete: () => {
      setIsDeleteModalOpen(false);
      setInfoMessage(
        "Delete event flow is prepared. Backend action can be connected next.",
      );
    },
    handleBroadcast: () => {
      setInfoMessage(
        "Broadcast flow is prepared. Connect with notification service when ready.",
      );
    },
    handleExportOrders: () => {
      setInfoMessage(
        "Export orders flow is prepared. Connect with CSV export endpoint when ready.",
      );
    },
  };
};