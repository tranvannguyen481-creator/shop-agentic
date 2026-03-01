import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { APP_PATHS } from "../../../app/route-config";
import { fetchGroupShareToken } from "../../../shared/services/event-api";
import { calculateOrder, placeOrder } from "../../../shared/services/order-api";
import { toVND } from "../../../shared/utils/price-utils";
import { EVENT_QUERY_KEYS } from "../constants/event-query-keys";
import {
  CheckoutPricingBreakdown,
  EventCheckoutLineItem,
  EventCheckoutPageViewModel,
} from "../types/event-checkout-page-types";
import { useGroupBuyRealtime } from "./use-group-buy-realtime";

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
  const queryClient = useQueryClient();
  const params = useParams<{ eventId: string }>();
  const eventId = params.eventId?.trim() ?? "";

  const [isGroupBuy, setIsGroupBuy] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isJoiningGroupBuy, setIsJoiningGroupBuy] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [placeOrderError, setPlaceOrderError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Real-time group buy listener (must be before calculateOrder) ─────────
  // Initialised early so that liveMemberCount is available to use as a
  // refetch trigger for the calculateOrder query below.
  const {
    liveMemberCount,
    toasts: groupBuyToasts,
    dismissToast,
  } = useGroupBuyRealtime(eventId, isGroupBuy);

  // ── Encrypted share token for group-buy links ──────────────────────────
  const { data: groupShareToken } = useQuery<string>({
    queryKey: [...EVENT_QUERY_KEYS.detail(eventId), "group-share-token"],
    queryFn: () => fetchGroupShareToken(eventId),
    enabled: !!eventId && isGroupBuy,
    staleTime: 5 * 60 * 1000, // token is stable for the same group
    retry: 1,
  });

  const shareUrl = useMemo(() => {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    const baseUrl = `${base}/event/detail/${eventId}`;
    if (isGroupBuy && groupShareToken) {
      return `${baseUrl}?groupToken=${encodeURIComponent(groupShareToken)}`;
    }
    return baseUrl;
  }, [eventId, isGroupBuy, groupShareToken]);

  const hasNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  const onCopyShareLink = useCallback(() => {
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        setShareCopied(true);
        if (copyTimer.current) clearTimeout(copyTimer.current);
        copyTimer.current = setTimeout(() => setShareCopied(false), 2200);
      })
      .catch(() => {
        // fallback: select text manually
      });
  }, [shareUrl]);

  const onNativeShare = useCallback(() => {
    if (!hasNativeShare) return;
    navigator
      .share({
        title: "Tham gia mua nhóm cùng mình!",
        text: "Cùng mua để được giảm giá nhé 🛍️",
        url: shareUrl,
      })
      .catch(() => {
        /* user dismissed */
      });
  }, [hasNativeShare, shareUrl]);

  useEffect(
    () => () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    },
    [],
  );

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
        totalDiscount: result.extraGroupDiscount ?? 0,
        subtotalAfterDiscount: result.subtotalAfterDiscount,
        vatRate: result.vatRate,
        vatAmount: result.vatAmount,
        grandTotal: result.grandTotal,
        currentMembers: result.currentMembers,
        minMembers: result.minMembers,
        membersNeededForDiscount: result.membersNeededForDiscount,
        willGetExtraDiscount: result.willGetExtraDiscount,
        potentialExtraDiscountPercent:
          result.potentialExtraDiscountPercent ?? 0,
      } satisfies CheckoutPricingBreakdown;
    },
    enabled: !!eventId && items.length > 0,
    staleTime: 0,
    retry: false,
    // Polling fallback: keeps member count fresh every 5 s even when
    // the Firestore real-time listener is blocked or unavailable.
    refetchInterval: isGroupBuy ? 5_000 : false,
  });

  // ── Invalidate calculateOrder whenever the live member count changes ──────
  // This ensures the server-side discount recalculation fires immediately
  // when Firestore notifies us of a new group member.
  const prevLiveMemberCountRef = useRef(liveMemberCount);
  useEffect(() => {
    if (!isGroupBuy) return;
    if (liveMemberCount !== prevLiveMemberCountRef.current) {
      prevLiveMemberCountRef.current = liveMemberCount;
      void queryClient.invalidateQueries({
        queryKey: EVENT_QUERY_KEYS.calculateOrder(
          eventId,
          isGroupBuy,
          itemInputs,
        ),
      });
    }
  }, [liveMemberCount, isGroupBuy, eventId, itemInputs, queryClient]);

  const calcErrorMessage =
    calcError instanceof Error
      ? calcError.message
      : calcError
        ? "Unable to calculate order"
        : null;

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + Math.max(1, item.quantity), 0),
    [items],
  );

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );

  const onToggleGroupBuy = useCallback(
    async (value: boolean) => {
      if (value) {
        // Joining: call API to create/join the group-buy session,
        // then navigate to the dedicated group-buy screen.
        if (isJoiningGroupBuy) return;
        setIsJoiningGroupBuy(true);
        setPlaceOrderError(null);
        try {
          const result = await joinGroupBuySession(eventId);
          navigate(APP_PATHS.eventGroupBuy.replace(":eventId", eventId), {
            state: { isHost: result.isHost },
          });
        } catch (err) {
          setPlaceOrderError(
            err instanceof Error
              ? err.message
              : "Không thể tham gia phiên mua nhóm",
          );
        } finally {
          setIsJoiningGroupBuy(false);
        }
      } else {
        setIsGroupBuy(false);
      }
    },
    [eventId, isJoiningGroupBuy, navigate],
  );

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
        `Order placed successfully! Order ID: ${result.orderId}. Total: ${toVND(result.grandTotal)}`,
      );
    } catch (err) {
      setPlaceOrderError(
        err instanceof Error ? err.message : "Failed to place order",
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
    isJoiningGroupBuy,
    orderId,
    pricingBreakdown,
    onToggleGroupBuy,
    shareUrl,
    shareCopied,
    hasNativeShare,
    liveMemberCount,
    groupBuyToasts,
    onDismissGroupBuyToast: dismissToast,
    onCopyShareLink,
    onNativeShare,
    onBackToDetail: () => {
      navigate(APP_PATHS.eventDetail.replace(":eventId", eventId));
    },
    onPlaceOrder,
  };
};
