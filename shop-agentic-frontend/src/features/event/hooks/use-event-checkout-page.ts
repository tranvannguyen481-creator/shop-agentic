import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { APP_PATHS } from "../../../app/route-config";
import {
  EventCheckoutLineItem,
  EventCheckoutPageViewModel,
} from "../types/event-checkout-page-types";

const toCurrency = (value: number) => `$${value.toFixed(2)}`;

const toLineItem = (source: unknown): EventCheckoutLineItem | null => {
  if (!source || typeof source !== "object") {
    return null;
  }

  const item = source as Record<string, unknown>;
  const name = typeof item.name === "string" ? item.name : "";

  if (!name.trim()) {
    return null;
  }

  return {
    productId: typeof item.productId === "string" ? item.productId : "",
    name,
    quantity: Math.max(1, Number(item.quantity ?? 1)),
    price: Number(item.price ?? 0) || 0,
    basePrice: Number(item.basePrice ?? 0) || 0,
    selectedChoices: Array.isArray(item.selectedChoices)
      ? item.selectedChoices.map((choice) => String(choice))
      : [],
  };
};

export const useEventCheckoutPage = (): EventCheckoutPageViewModel => {
  const navigate = useNavigate();
  const params = useParams<{ eventId: string }>();
  const eventId = params.eventId?.trim() ?? "";
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const items = useMemo(() => {
    const rawDraft = window.localStorage.getItem(
      `event:${eventId}:draft-order`,
    );

    if (!rawDraft) {
      return [];
    }

    try {
      const parsed = JSON.parse(rawDraft) as unknown[];
      return parsed
        .map((entry) => toLineItem(entry))
        .filter((item): item is EventCheckoutLineItem => Boolean(item));
    } catch {
      return [];
    }
  }, [eventId]);

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + Math.max(1, item.quantity), 0),
    [items],
  );

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );

  return {
    eventId,
    items,
    itemCount,
    subtotalText: toCurrency(subtotal),
    hasItems: items.length > 0,
    infoMessage,
    onBackToDetail: () => {
      navigate(APP_PATHS.eventDetail.replace(":eventId", eventId));
    },
    onPlaceOrder: () => {
      if (items.length === 0) {
        return;
      }

      setInfoMessage("Checkout submitted. Payment flow can be connected next.");
    },
  };
};
