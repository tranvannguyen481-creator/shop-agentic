import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { APP_PATHS } from "../../../app/route-config";
import { calculateOrder, placeOrder } from "../../../shared/services/order-api";
import { toVND } from "../../../shared/utils/price-utils";
import { EVENT_QUERY_KEYS } from "../constants/event-query-keys";
import {
  CheckoutPricingBreakdown,
  EventCheckoutLineItem,
  EventCheckoutPageViewModel,
} from "../types/event-checkout-page-types";

const toLineItem = (source: unknown): EventCheckoutLineItem | null => {
  if (!source || typeof source !== "object") return null;
  const item = source as Record<string, unknown>;
  const name = typeof item.name === "string" ? item.name : "";
  if (!name.trim()) return null;
  return {
    productId: typeof item.productId === "string" ? item.productId : "",
    name,
    quantity: Math.max(1, Number(item.quantity ?? 1)),
    price: Number(item.price ?? 0) || 0,
    basePrice: Number(item.basePrice ?? 0) || 0,
    normalPrice: Number(item.normalPrice ?? item.basePrice ?? 0) || 0,
    selectedChoices: Array.isArray(item.selectedChoices)
      ? item.selectedChoices.map((choice) => String(choice))
      : [],
  };
};

export const useEventCheckoutPage = (): EventCheckoutPageViewModel => {
  const navigate = useNavigate();
  const params = useParams<{ eventId: string }>();
  const eventId = params.eventId?.trim() ?? "";

  const [isGroupBuy, setIsGroupBuy] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [placeOrderError, setPlaceOrderError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  const items = useMemo(() => {
    const rawDraft = window.localStorage.getItem(
      `event:${eventId}:draft-order`,
    );
    if (!rawDraft) return [];
    try {
      const parsed = JSON.parse(rawDraft) as unknown[];
      return parsed
        .map((entry) => toLineItem(entry))
        .filter((item): item is EventCheckoutLineItem => Boolean(item));
    } catch {
      return [];
    }
  }, [eventId]);

  const itemInputs = useMemo(
    () =>
      items.map((item) => ({ productId: item.productId, qty: item.quantity })),
    [items],
  );

  const {
    data: pricingBreakdown = null,
    isFetching: isCalculating,
    error: calcError,
  } = useQuery<CheckoutPricingBreakdown | null>({
    queryKey: EVENT_QUERY_KEYS.calculateOrder(eventId, isGroupBuy, itemInputs),
    queryFn: async () => {
      const result = await calculateOrder({
        eventId,
        isGroupBuy,
        items: itemInputs,
      });
      return {
        subtotalBeforeDiscount: result.subtotalBeforeDiscount,
        extraGroupDiscountPercent: result.extraGroupDiscountPercent,
        totalDiscount: result.totalDiscount,
        subtotalAfterDiscount: result.subtotalAfterDiscount,
        vatRate: result.vatRate,
        vatAmount: result.vatAmount,
        grandTotal: result.grandTotal,
        currentMembers: result.currentMembers,
        minMembers: result.minMembers,
        membersNeededForDiscount: result.membersNeededForDiscount,
        willGetExtraDiscount: result.willGetExtraDiscount,
      } satisfies CheckoutPricingBreakdown;
    },
    enabled: !!eventId && items.length > 0,
    staleTime: 0,
    retry: false,
  });

  const calcErrorMessage =
    calcError instanceof Error
      ? calcError.message
      : calcError
        ? "Không thể tính đơn hàng"
        : null;

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + Math.max(1, item.quantity), 0),
    [items],
  );

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );

  const onToggleGroupBuy = useCallback((value: boolean) => {
    setIsGroupBuy(value);
  }, []);

  const onPlaceOrder = useCallback(async () => {
    if (items.length === 0 || isPlacingOrder) return;
    setIsPlacingOrder(true);
    setPlaceOrderError(null);
    try {
      const result = await placeOrder({
        eventId,
        isGroupBuy,
        items: itemInputs,
        paymentMethod: "cod" as const,
      });
      window.localStorage.removeItem(`event:${eventId}:draft-order`);
      window.localStorage.removeItem(`event-cart:${eventId}`);
      setOrderId(result.orderId);
      setInfoMessage(
        `Đặt hàng thành công! Mã đơn: ${result.orderId}. Tổng cộng: ${toVND(result.grandTotal)}`,
      );
    } catch (err) {
      setPlaceOrderError(
        err instanceof Error ? err.message : "Đặt hàng thất bại",
      );
    } finally {
      setIsPlacingOrder(false);
    }
  }, [eventId, isGroupBuy, itemInputs, isPlacingOrder, items.length]);

  return {
    eventId,
    items,
    itemCount,
    subtotalText: toVND(subtotal),
    hasItems: items.length > 0,
    infoMessage,
    errorMessage: placeOrderError ?? calcErrorMessage,
    isGroupBuy,
    isCalculating,
    isPlacingOrder,
    orderId,
    pricingBreakdown,
    onToggleGroupBuy,
    onBackToDetail: () => {
      navigate(APP_PATHS.eventDetail.replace(":eventId", eventId));
    },
    onPlaceOrder,
  };
};
