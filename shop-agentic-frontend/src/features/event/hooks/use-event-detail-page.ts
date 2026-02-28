import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { APP_PATHS } from "../../../app/route-config";
import {
  fetchEventDetail,
  reHostEvent,
} from "../../../shared/services/event-api";
import { EVENT_QUERY_KEYS } from "../constants/event-query-keys";
import {
  EventDetailPageViewModel,
  EventDetailProductItem,
} from "../types/event-detail-page-types";
import {
  toAdminFeeValue,
  toCurrency,
  toProductItem,
} from "../utils/event-detail-mappers";
import { useEventCart } from "./use-event-cart";

export const useEventDetailPage = (): EventDetailPageViewModel => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const params = useParams<{ eventId: string }>();
  const eventId = params.eventId?.trim() ?? "";

  const {
    data: event,
    isLoading,
    error,
  } = useQuery({
    queryKey: EVENT_QUERY_KEYS.detail(eventId),
    queryFn: () => fetchEventDetail(eventId),
    enabled: !!eventId,
  });

  const reHostMutation = useMutation({
    mutationFn: () => reHostEvent(eventId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["groupEvents"] });
      navigate(
        APP_PATHS.updateEvent + "?id=" + encodeURIComponent(result.eventId),
      );
    },
  });

  const { orderLines, orderItemCount, infoMessage, onAddOrderLine } =
    useEventCart();

  const products = useMemo(() => {
    const rawProducts =
      event && Array.isArray(event.products)
        ? event.products
        : ([] as unknown[]);

    return rawProducts
      .map((item, index) => {
        if (!item || typeof item !== "object") {
          return null;
        }

        return toProductItem(item as Record<string, unknown>, index);
      })
      .filter((item): item is EventDetailProductItem => Boolean(item));
  }, [event]);

  const adminFeeValue = useMemo(
    () => toAdminFeeValue(event?.adminFee),
    [event?.adminFee],
  );

  const productByIdMap = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );

  const rawImportantNotes = event?.importantNotes;
  const importantNotesSource = Array.isArray(rawImportantNotes)
    ? rawImportantNotes
    : [];

  const resolvedStatus =
    typeof event?.status === "string" ? event.status : "active";
  const isClosed = resolvedStatus.toLowerCase() === "closed";

  return {
    eventId,
    title: typeof event?.title === "string" ? event.title : "Event detail",
    description:
      typeof event?.description === "string" ? event.description : "",
    closingInText:
      typeof event?.closingInText === "string"
        ? event.closingInText
        : "Closing soon",
    closingDate:
      typeof event?.closingDate === "string" ? event.closingDate : "-",
    collectionDate:
      typeof event?.collectionDate === "string" ? event.collectionDate : "-",
    collectionTime:
      typeof event?.collectionTime === "string" ? event.collectionTime : "-",
    pickupLocation:
      typeof event?.pickupLocation === "string" ? event.pickupLocation : "-",
    importantNotes: importantNotesSource.map((note) => String(note)),
    bannerPreviewUrl:
      typeof event?.bannerPreviewUrl === "string" ? event.bannerPreviewUrl : "",
    hostDisplayName:
      typeof event?.hostDisplayName === "string"
        ? event.hostDisplayName
        : "Host",
    joinedCount: Number(event?.buyCount ?? 0),
    adminFeeText: toCurrency(adminFeeValue),
    status: resolvedStatus,
    isClosed,
    groupId: typeof event?.groupId === "string" ? event.groupId : "",
    groupName: typeof event?.groupName === "string" ? event.groupName : "",
    products,
    orderItemCount,
    canProceedCheckout: !isClosed && orderLines.length > 0,
    infoMessage,
    isLoading,
    isReHosting: reHostMutation.isPending,
    error: error
      ? error instanceof Error
        ? error.message
        : "Failed to fetch event detail"
      : null,
    vatRate: Number(event?.vatRate ?? 0.1),
    discountRules:
      (event?.discountRules as EventDetailPageViewModel["discountRules"]) ?? {
        groupBuy: { enabled: false, minMembers: 0, extraDiscountPercent: 0 },
      },
    currentMembers: Number(event?.currentCount ?? event?.buyCount ?? 0),
    onAddToOrder: onAddOrderLine,
    onProceedCheckout: () => {
      if (orderLines.length === 0 || isClosed) {
        return;
      }

      const orderPayload = orderLines
        .map((line) => {
          const product = productByIdMap.get(line.productId);
          return {
            productId: line.productId,
            name: line.productName,
            quantity: line.quantity,
            price: line.unitPrice,
            selectedChoices: line.selectedChoices.map((choice) => choice.name),
            basePrice: product?.basePrice ?? line.unitPrice,
            normalPrice:
              product?.normalPrice ?? product?.basePrice ?? line.unitPrice,
          };
        })
        .filter(Boolean);

      window.localStorage.setItem(
        `event:${eventId}:draft-order`,
        JSON.stringify(orderPayload),
      );
      navigate(APP_PATHS.eventCheckout.replace(":eventId", eventId));
    },
    onBackToEvents: () => navigate(APP_PATHS.listMyEvents),
    onReHost: () => reHostMutation.mutate(),
  };
};
