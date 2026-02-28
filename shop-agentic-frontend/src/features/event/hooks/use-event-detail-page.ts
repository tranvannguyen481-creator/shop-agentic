import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { APP_PATHS } from "../../../app/route-config";
import {
  fetchEventDetail,
  reHostEvent,
} from "../../../shared/services/event-api";
import { EVENT_QUERY_KEYS } from "../constants/event-query-keys";
import {
  computeStockStatus,
  EventAddToOrderPayload,
  EventDetailPageViewModel,
  EventDetailProductItem,
} from "../types/event-detail-page-types";
import {
  toAdminFeeValue,
  toCurrency,
  toProductItem,
} from "../utils/event-detail-mappers";
import { useEventCart } from "./use-event-cart";
import { useEventProductQuantities } from "./use-event-product-quantities";

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

  const {
    orderLines,
    orderItemCount,
    infoMessage,
    onAddOrderLine,
    onRemoveOrderLine,
    onClearCart,
  } = useEventCart(eventId);

  const [cartError, setCartError] = useState<string | null>(null);

  const liveData = useEventProductQuantities(eventId);

  const products = useMemo(() => {
    const rawProducts =
      event && Array.isArray(event.products)
        ? event.products
        : ([] as unknown[]);

    return rawProducts
      .map((item, index) => {
        if (!item || typeof item !== "object") return null;

        const base = toProductItem(item as Record<string, unknown>, index);

        const totalGroupQty =
          liveData.groupQtyMap[base.id] ?? base.totalGroupQty;

        // Prefer live stock from Firestore snapshot; fall back to REST value
        const liveStock = liveData.stockMap[base.id];
        const stock =
          typeof liveStock === "number" ? liveStock : (base.stock ?? 0);

        const availableQty =
          stock > 0
            ? Math.max(0, stock - totalGroupQty)
            : Number.POSITIVE_INFINITY;

        const stockStatus = computeStockStatus(availableQty);

        return { ...base, totalGroupQty, availableQty, stockStatus };
      })
      .filter((item): item is EventDetailProductItem => Boolean(item));
  }, [event, liveData]);

  const adminFeeValue = useMemo(
    () => toAdminFeeValue(event?.adminFee),
    [event?.adminFee],
  );

  const productByIdMap = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );

  const cartQtyByProductId = useMemo(() => {
    const map: Record<string, number> = {};
    for (const line of orderLines) {
      map[line.productId] = (map[line.productId] ?? 0) + line.quantity;
    }
    return map;
  }, [orderLines]);

  /**
   * Stock-aware wrapper around `onAddOrderLine`.
   * - Rejects out-of-stock products.
   * - Caps the quantity to the remaining available stock.
   */
  const onAddToOrder = useCallback(
    (payload: EventAddToOrderPayload) => {
      const product = productByIdMap.get(payload.product.id);
      if (!product) return;

      if (product.stockStatus === "out-of-stock") {
        setCartError(`"${product.name}" is out of stock.`);
        return;
      }

      if (product.availableQty !== Number.POSITIVE_INFINITY) {
        const alreadyInCart = cartQtyByProductId[product.id] ?? 0;
        const canAdd = Math.max(0, product.availableQty - alreadyInCart);
        if (canAdd === 0) {
          setCartError(
            `"${product.name}" — no more stock available (${product.availableQty} total, all in your cart).`,
          );
          return;
        }
        const cappedQty = Math.min(payload.quantity, canAdd);
        setCartError(null);
        onAddOrderLine({ ...payload, quantity: cappedQty });
        return;
      }

      setCartError(null);
      onAddOrderLine(payload);
    },
    [onAddOrderLine, productByIdMap, cartQtyByProductId],
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
    cartQtyByProductId,
    canProceedCheckout: !isClosed && orderLines.length > 0,
    infoMessage,
    cartError,
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
    onAddToOrder,
    onRemoveOrderLine,
    onClearCart,
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
      // Cart is kept until the order is successfully placed (handled in checkout page)
      navigate(APP_PATHS.eventCheckout.replace(":eventId", eventId));
    },
    onBackToEvents: () => navigate(APP_PATHS.listMyEvents),
    onReHost: () => reHostMutation.mutate(),
  };
};
