import { useCallback, useMemo, useState } from "react";
import {
  EventAddToOrderPayload,
  EventDetailCartLineItem,
} from "../types/event-detail-page-types";

export interface UseEventCartResult {
  orderLines: EventDetailCartLineItem[];
  orderItemCount: number;
  infoMessage: string | null;
  onAddOrderLine: (payload: EventAddToOrderPayload) => void;
}

export const useEventCart = (): UseEventCartResult => {
  const [orderLines, setOrderLines] = useState<EventDetailCartLineItem[]>([]);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

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

  const orderItemCount = useMemo(
    () =>
      orderLines.reduce(
        (sum, line) => sum + Math.max(1, Number(line.quantity || 1)),
        0,
      ),
    [orderLines],
  );

  return { orderLines, orderItemCount, infoMessage, onAddOrderLine };
};
