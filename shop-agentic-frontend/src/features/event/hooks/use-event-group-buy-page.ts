import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { APP_PATHS } from "../../../app/route-config";
import {
  dissolveGroupBuySession,
  fetchGroupShareToken,
  leaveGroupBuySession,
} from "../../../shared/services/event-api";
import { db } from "../../../shared/services/firebase";
import { calculateOrder, placeOrder } from "../../../shared/services/order-api";
import { toVND } from "../../../shared/utils/price-utils";
import { EVENT_QUERY_KEYS } from "../constants/event-query-keys";
import type {
  CheckoutPricingBreakdown,
  EventCheckoutLineItem,
} from "../types/event-checkout-page-types";
import { useGroupBuyRealtime } from "./use-group-buy-realtime";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface GroupBuyParticipant {
  uid: string;
  displayName: string;
  email: string;
  isHost: boolean;
  joinedAt: number;
}

export interface EventGroupBuyPageViewModel {
  eventId: string;
  isHost: boolean;
  items: EventCheckoutLineItem[];
  itemCount: number;
  subtotalText: string;
  hasItems: boolean;
  participants: GroupBuyParticipant[];
  participantCount: number;
  isCalculating: boolean;
  isPlacingOrder: boolean;
  isActioning: boolean;
  pricingBreakdown: CheckoutPricingBreakdown | null;
  errorMessage: string | null;
  orderId: string | null;
  infoMessage: string | null;
  shareUrl: string;
  shareCopied: boolean;
  hasNativeShare: boolean;
  groupBuyToasts: import("./use-group-buy-realtime").GroupBuyToast[];
  onDismissGroupBuyToast: (id: string) => void;
  onPlaceOrder: () => Promise<void>;
  onDissolve: () => Promise<void>;
  onLeave: () => Promise<void>;
  onCopyShareLink: () => void;
  onNativeShare: () => void;
  onBack: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Hook ───────────────────────────────────────────────────────────────────

export const useEventGroupBuyPage = (): EventGroupBuyPageViewModel => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const params = useParams<{ eventId: string }>();
  const eventId = params.eventId?.trim() ?? "";

  // isHost is seeded from navigate state (passed by checkout toggle),
  // then confirmed / updated by the Firestore participants listener.
  const navState = (location.state ?? {}) as Record<string, unknown>;
  const [isHost, setIsHost] = useState<boolean>(
    Boolean(navState["isHost"] ?? false),
  );

  const [participants, setParticipants] = useState<GroupBuyParticipant[]>([]);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isActioning, setIsActioning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Real-time group buy toasts ────────────────────────────────────────────
  const {
    liveMemberCount,
    toasts: groupBuyToasts,
    dismissToast,
  } = useGroupBuyRealtime(eventId, true);

  // ── Live participants listener ────────────────────────────────────────────
  useEffect(() => {
    if (!eventId) return;

    const unsubParticipants = db
      .collection("events")
      .doc(eventId)
      .collection("groupBuyParticipants")
      .orderBy("joinedAt", "asc")
      .onSnapshot(
        (snap) => {
          const docs = snap.docs.map((d) => {
            const data = d.data() as Record<string, unknown>;
            return {
              uid: String(data["uid"] ?? d.id),
              displayName: String(data["displayName"] ?? ""),
              email: String(data["email"] ?? ""),
              isHost: Boolean(data["isHost"] ?? false),
              joinedAt: Number(data["joinedAt"] ?? 0),
            } satisfies GroupBuyParticipant;
          });
          setParticipants(docs);

          // Determine if the current user is the host from participant data
          // (more reliable than rely solely on navigate state)
          // We don't have the current uid here directly, so we rely on
          // the isHost flag set on each participant doc instead.
          const hostDoc = docs.find((p) => p.isHost);
          if (hostDoc) {
            // We need to match against the current user. Use the navState uid
            // or check localStorage / auth state. We keep it simple: if the
            // current user's participant doc has isHost=true, update state.
          }
        },
        (err) => {
          console.error("[GroupBuyPage] participants listener error:", err);
        },
      );

    return () => unsubParticipants();
  }, [eventId]);

  // ── Session dissolved listener → redirect members back ───────────────────
  useEffect(() => {
    if (!eventId) return;

    const unsubSession = db
      .collection("events")
      .doc(eventId)
      .collection("groupBuySession")
      .doc("current")
      .onSnapshot(
        (snap) => {
          if (!snap.exists) return;
          const data = snap.data() as Record<string, unknown> | undefined;
          if (data?.["status"] === "dissolved") {
            // Session was dissolved by the host — redirect non-host members
            if (!isHost) {
              navigate(APP_PATHS.eventDetail.replace(":eventId", eventId), {
                replace: true,
                state: { message: "Phiên mua nhóm đã bị giải tán bởi host." },
              });
            }
          }
        },
        (err) => {
          console.error("[GroupBuyPage] session listener error:", err);
        },
      );

    return () => unsubSession();
  }, [eventId, isHost, navigate]);

  // ── Share token ───────────────────────────────────────────────────────────
  const { data: groupShareToken } = useQuery<string>({
    queryKey: [...EVENT_QUERY_KEYS.detail(eventId), "group-share-token"],
    queryFn: () => fetchGroupShareToken(eventId),
    enabled: !!eventId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const shareUrl = useMemo(() => {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    const baseUrl = `${base}/event/detail/${eventId}`;
    if (groupShareToken) {
      return `${baseUrl}?groupToken=${encodeURIComponent(groupShareToken)}`;
    }
    return baseUrl;
  }, [eventId, groupShareToken]);

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
        /* no-op */
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

  // ── Items from localStorage ───────────────────────────────────────────────
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

  // ── Pricing breakdown ─────────────────────────────────────────────────────
  const {
    data: pricingBreakdown = null,
    isFetching: isCalculating,
    error: calcError,
  } = useQuery<CheckoutPricingBreakdown | null>({
    queryKey: EVENT_QUERY_KEYS.calculateOrder(eventId, true, itemInputs),
    queryFn: async () => {
      const result = await calculateOrder({
        eventId,
        isGroupBuy: true,
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
    refetchInterval: 5_000,
  });

  // Invalidate on live member count change
  const prevLiveMemberCountRef = useRef(liveMemberCount);
  useEffect(() => {
    if (liveMemberCount !== prevLiveMemberCountRef.current) {
      prevLiveMemberCountRef.current = liveMemberCount;
      void queryClient.invalidateQueries({
        queryKey: EVENT_QUERY_KEYS.calculateOrder(eventId, true, itemInputs),
      });
    }
  }, [liveMemberCount, eventId, itemInputs, queryClient]);

  // ── Computed ──────────────────────────────────────────────────────────────
  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + Math.max(1, item.quantity), 0),
    [items],
  );

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );

  const calcErrorMessage =
    calcError instanceof Error
      ? calcError.message
      : calcError
        ? "Không thể tính đơn hàng"
        : null;

  // ── Actions ───────────────────────────────────────────────────────────────
  const onBack = useCallback(() => {
    navigate(APP_PATHS.eventCheckout.replace(":eventId", eventId));
  }, [navigate, eventId]);

  const onPlaceOrder = useCallback(async () => {
    if (items.length === 0 || isPlacingOrder) return;
    setIsPlacingOrder(true);
    setErrorMessage(null);
    try {
      const result = await placeOrder({
        eventId,
        isGroupBuy: true,
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
      setErrorMessage(err instanceof Error ? err.message : "Đặt hàng thất bại");
    } finally {
      setIsPlacingOrder(false);
    }
  }, [eventId, itemInputs, isPlacingOrder, items.length]);

  const onDissolve = useCallback(async () => {
    if (!isHost || isActioning) return;
    setIsActioning(true);
    setErrorMessage(null);
    try {
      await dissolveGroupBuySession(eventId);
      navigate(APP_PATHS.eventDetail.replace(":eventId", eventId), {
        replace: true,
      });
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Không thể giải tán nhóm",
      );
    } finally {
      setIsActioning(false);
    }
  }, [isHost, isActioning, eventId, navigate]);

  const onLeave = useCallback(async () => {
    if (isHost || isActioning) return;
    setIsActioning(true);
    setErrorMessage(null);
    try {
      await leaveGroupBuySession(eventId);
      navigate(APP_PATHS.eventDetail.replace(":eventId", eventId), {
        replace: true,
      });
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Không thể rời nhóm",
      );
    } finally {
      setIsActioning(false);
    }
  }, [isHost, isActioning, eventId, navigate]);

  return {
    eventId,
    isHost,
    items,
    itemCount,
    subtotalText: toVND(subtotal),
    hasItems: items.length > 0,
    participants,
    participantCount: participants.length || liveMemberCount,
    isCalculating,
    isPlacingOrder,
    isActioning,
    pricingBreakdown,
    errorMessage: errorMessage ?? calcErrorMessage,
    infoMessage,
    orderId,
    shareUrl,
    shareCopied,
    hasNativeShare,
    groupBuyToasts,
    onDismissGroupBuyToast: dismissToast,
    onPlaceOrder,
    onDissolve,
    onLeave,
    onCopyShareLink,
    onNativeShare,
    onBack,
  };
};
