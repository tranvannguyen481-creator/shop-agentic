import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { APP_PATHS } from "../../../app/route-config";
import { fetchEventDetail } from "../../../shared/services/event-api";
import {
  EventAddToOrderPayload,
  EventDetailCartLineItem,
  EventDetailPageViewModel,
  EventDetailProductItem,
  EventDetailProductOptionChoice,
  EventDetailProductOptionGroup,
} from "../types/event-detail-page-types";

const toProductItem = (
  item: Record<string, unknown>,
  index: number,
): EventDetailProductItem => {
  const rawOptions = Array.isArray(item.options) ? item.options : [];
  const rawOptionGroups = Array.isArray(item.optionGroups)
    ? item.optionGroups
    : [];

  const optionGroups = rawOptionGroups
    .map((optionGroup, groupIndex) => {
      if (!optionGroup || typeof optionGroup !== "object") {
        return null;
      }

      const typedGroup = optionGroup as Record<string, unknown>;
      const rawChoices = Array.isArray(typedGroup.choices)
        ? typedGroup.choices
        : [];

      const choices = rawChoices
        .map((choice, choiceIndex) => {
          if (!choice || typeof choice !== "object") {
            return null;
          }

          const typedChoice = choice as Record<string, unknown>;
          const choiceName =
            typeof typedChoice.name === "string" ? typedChoice.name : "";

          if (!choiceName.trim()) {
            return null;
          }

          return {
            id:
              typeof typedChoice.id === "string" && typedChoice.id.trim()
                ? typedChoice.id
                : `${index + 1}-${groupIndex + 1}-${choiceIndex + 1}`,
            name: choiceName,
            price: Number(typedChoice.price ?? 0) || 0,
          };
        })
        .filter((choice): choice is EventDetailProductOptionChoice =>
          Boolean(choice),
        );

      if (choices.length === 0) {
        return null;
      }

      return {
        id:
          typeof typedGroup.id === "string" && typedGroup.id.trim()
            ? typedGroup.id
            : `group-${index + 1}-${groupIndex + 1}`,
        name:
          typeof typedGroup.name === "string" && typedGroup.name.trim()
            ? typedGroup.name
            : `Option ${groupIndex + 1}`,
        required: Boolean(typedGroup.required),
        choices,
      };
    })
    .filter((optionGroup): optionGroup is EventDetailProductOptionGroup =>
      Boolean(optionGroup),
    );

  const basePriceRaw = Number(item.basePrice ?? item.price ?? 0);
  const basePrice = Number.isFinite(basePriceRaw) ? basePriceRaw : 0;
  const priceText =
    typeof item.price === "string" && item.price.trim()
      ? item.price
      : `$${basePrice.toFixed(2)}`;

  return {
    id:
      typeof item.id === "string" && item.id.trim()
        ? item.id
        : `product-${index + 1}`,
    name:
      typeof item.name === "string" && item.name.trim()
        ? item.name
        : `Item ${index + 1}`,
    description: typeof item.description === "string" ? item.description : "",
    basePrice,
    price: priceText,
    imagePreviewUrl:
      typeof item.imagePreviewUrl === "string" ? item.imagePreviewUrl : "",
    options: rawOptions
      .map((option) => (typeof option === "string" ? option : ""))
      .filter(Boolean),
    optionGroups,
  };
};

const toCurrency = (value: number) => `$${value.toFixed(2)}`;

const toAdminFeeValue = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^\d.-]/g, "").trim());
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

export const useEventDetailPage = (): EventDetailPageViewModel => {
  const navigate = useNavigate();
  const params = useParams<{ eventId: string }>();
  const eventId = params.eventId?.trim() ?? "";

  const { data: event, isLoading, error } = useQuery({
    queryKey: ["eventDetail", eventId],
    queryFn: () => fetchEventDetail(eventId),
    enabled: !!eventId,
  });

  const [orderLines, setOrderLines] = useState<EventDetailCartLineItem[]>([]);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

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
        (sum, orderLine) => sum + Math.max(1, Number(orderLine.quantity || 1)),
        0,
      ),
    [orderLines],
  );

  const rawImportantNotes = event?.importantNotes;
  const importantNotesSource = Array.isArray(rawImportantNotes)
    ? rawImportantNotes
    : [];

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
    status: typeof event?.status === "string" ? event.status : "active",
    products,
    orderItemCount,
    canProceedCheckout: orderLines.length > 0,
    infoMessage,
    isLoading,
    error: error
      ? error instanceof Error
        ? error.message
        : "Failed to fetch event detail"
      : null,
    onAddToOrder: onAddOrderLine,
    onProceedCheckout: () => {
      if (orderLines.length === 0) {
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
  };
};