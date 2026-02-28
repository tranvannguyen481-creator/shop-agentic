import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  EventAddToOrderPayload,
  EventDetailCartLineItem,
} from "../types/event-detail-page-types";

const CART_STORAGE_PREFIX = "event-cart:";

function readCartFromStorage(eventId: string): EventDetailCartLineItem[] {
  if (!eventId) return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_PREFIX + eventId);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as EventDetailCartLineItem[];
  } catch {
    return [];
  }
}

function writeCartToStorage(eventId: string, lines: EventDetailCartLineItem[]) {
  if (!eventId) return;
  try {
    if (lines.length === 0) {
      localStorage.removeItem(CART_STORAGE_PREFIX + eventId);
    } else {
      localStorage.setItem(
        CART_STORAGE_PREFIX + eventId,
        JSON.stringify(lines),
      );
    }
  } catch {
    // ignore quota errors
  }
}

export interface UseEventCartResult {
  orderLines: EventDetailCartLineItem[];
  orderItemCount: number;
  infoMessage: string | null;
  onAddOrderLine: (payload: EventAddToOrderPayload) => void;
  onRemoveOrderLine: (lineId: string) => void;
  onClearCart: () => void;
}

export const useEventCart = (eventId: string): UseEventCartResult => {
  const [orderLines, setOrderLines] = useState<EventDetailCartLineItem[]>(() =>
    readCartFromStorage(eventId),
  );
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // keep a ref so the effect below always has the latest eventId
  const eventIdRef = useRef(eventId);
  useEffect(() => {
    eventIdRef.current = eventId;
  }, [eventId]);

  // When eventId changes (navigating to a different event), reload cart
  const prevEventIdRef = useRef(eventId);
  useEffect(() => {
    if (prevEventIdRef.current !== eventId) {
      prevEventIdRef.current = eventId;
      setOrderLines(readCartFromStorage(eventId));
      setInfoMessage(null);
    }
  }, [eventId]);

  // Persist cart to localStorage whenever it changes
  useEffect(() => {
    writeCartToStorage(eventIdRef.current, orderLines);
  }, [orderLines]);

  const onAddOrderLine = useCallback((payload: EventAddToOrderPayload) => {
    const selectedSet = new Set(payload.selectedChoiceIds);

    const selectedChoices = payload.product.optionGroups.flatMap((group) =>
      group.choices.filter((choice) => selectedSet.has(choice.id)),
    );

    const selectedPrice = selectedChoices.reduce(
      (sum, choice) => sum + Number(choice.price || 0),
      0,
    );

    const unitPrice = payload.product.basePrice + selectedPrice;
    const quantity = Math.max(1, payload.quantity);
    const subtotal = unitPrice * quantity;

    const fingerprint = [
      payload.product.id,
      ...selectedChoices.map((choice) => choice.id).sort(),
    ].join("|");

    setOrderLines((previousLines) => {
      const existingIndex = previousLines.findIndex(
        (line) => line.lineId === fingerprint,
      );

      if (existingIndex === -1) {
        return [
          ...previousLines,
          {
            lineId: fingerprint,
            productId: payload.product.id,
            productName: payload.product.name,
            quantity,
            unitPrice,
            subtotal,
            selectedChoices,
          },
        ];
      }

      const nextLines = [...previousLines];
      const currentLine = nextLines[existingIndex];
      const nextQuantity = currentLine.quantity + quantity;

      nextLines[existingIndex] = {
        ...currentLine,
        quantity: nextQuantity,
        subtotal: currentLine.unitPrice * nextQuantity,
      };

      return nextLines;
    });

    setInfoMessage(`Added ${payload.product.name}.`);
  }, []);

  const onRemoveOrderLine = useCallback((lineId: string) => {
    setOrderLines((prev) => prev.filter((line) => line.lineId !== lineId));
  }, []);

  const onClearCart = useCallback(() => {
    setOrderLines([]);
    setInfoMessage(null);
  }, []);

  const orderItemCount = useMemo(
    () =>
      orderLines.reduce(
        (sum, line) => sum + Math.max(1, Number(line.quantity || 1)),
        0,
      ),
    [orderLines],
  );

  return {
    orderLines,
    orderItemCount,
    infoMessage,
    onAddOrderLine,
    onRemoveOrderLine,
    onClearCart,
  };
};
