import admin from "@/app/config/firebaseAdmin";
import {
  EVENT_STATUS,
  type EventListItem,
  type EventProductItem,
  type EventStatus,
  type GroupEventListItem,
} from "@/features/event/types/event.types";
import { toNumber, toPriceNumber } from "@/shared/utils/firestore.utils";
import type { DecodedIdToken } from "firebase-admin/auth";
import { resolveGroupId, toYearMonth } from "./event-helpers";

const db = admin.firestore();

// ─── mapEventPayload ──────────────────────────────────────────────────────────

export const mapEventPayload = (
  data: Record<string, unknown>,
  actor: DecodedIdToken | null,
): Record<string, unknown> => {
  const now = Date.now();
  const createEventDraft = (data["createEventDraft"] ?? data) as Record<
    string,
    unknown
  >;
  const createItemsDraft = (data["createItemsDraft"] ?? {}) as Record<
    string,
    unknown
  >;
  const groupId = resolveGroupId(data);

  return {
    title: createEventDraft["title"] ?? "",
    description: createEventDraft["description"] ?? "",
    mode: createEventDraft["mode"] ?? "group-buy",
    pickupLocation: createEventDraft["pickupLocation"] ?? "",
    closingDate: createEventDraft["closingDate"] ?? "",
    collectionDate: createEventDraft["collectionDate"] ?? "",
    collectionTime: createEventDraft["collectionTime"] ?? "",
    paymentAfterClosing: Boolean(createEventDraft["paymentAfterClosing"]),
    payTogether: Boolean(createEventDraft["payTogether"]),
    adminFee: String(createEventDraft["adminFee"] ?? "0"),
    addImportantNotes: Boolean(createEventDraft["addImportantNotes"]),
    importantNotes: Array.isArray(createEventDraft["importantNotes"])
      ? createEventDraft["importantNotes"]
      : [],
    addExternalUrl: Boolean(createEventDraft["addExternalUrl"]),
    externalUrlFieldName: createEventDraft["externalUrlFieldName"] ?? "",
    externalUrl: createEventDraft["externalUrl"] ?? "",
    addDeliveryOptions: Boolean(createEventDraft["addDeliveryOptions"]),
    deliveryScheduleDate: createEventDraft["deliveryScheduleDate"] ?? "",
    deliveryTimeFrom: createEventDraft["deliveryTimeFrom"] ?? "",
    deliveryTimeTo: createEventDraft["deliveryTimeTo"] ?? "",
    deliveryFees: Array.isArray(createEventDraft["deliveryFees"])
      ? createEventDraft["deliveryFees"]
      : [],
    requestDeliveryDetails: Boolean(createEventDraft["requestDeliveryDetails"]),
    groupId,
    yearMonth: toYearMonth(createEventDraft["closingDate"], now),
    items: (Array.isArray(createItemsDraft["items"])
      ? createItemsDraft["items"]
      : []
    ).map((item: unknown) => {
      const i = item as Record<string, unknown>;
      return {
        ...i,
        id:
          typeof i["id"] === "string" && i["id"].trim()
            ? i["id"].trim()
            : db.collection("_").doc().id,
      };
    }),
    bannerPreviewUrls: Array.isArray(createItemsDraft["bannerPreviewUrls"])
      ? createItemsDraft["bannerPreviewUrls"]
      : [],
    currentCount: toNumber(data["currentCount"], 0),
    buyCount: toNumber(data["buyCount"], 0),
    totalPurchase: String(data["totalPurchase"] ?? "$0.00"),
    status: (data["status"] as EventStatus) ?? EVENT_STATUS.ACTIVE,
    userId: actor?.uid ?? data["userId"] ?? "",
    hostUid: actor?.uid ?? data["hostUid"] ?? "",
    hostEmail: actor?.email ?? data["hostEmail"] ?? "",
    hostDisplayName:
      (actor as Record<string, unknown> | null)?.["name"] ??
      (actor as Record<string, unknown> | null)?.["displayName"] ??
      data["hostDisplayName"] ??
      "",
    createdAt: data["createdAt"] ?? now,
    updatedAt: now,
    // VAT 10% theo Luật Thuế GTGT VN 2024 & Thông tư 219/2013
    vatRate: typeof data["vatRate"] === "number" ? data["vatRate"] : 0.1,
    discountRules:
      data["discountRules"] && typeof data["discountRules"] === "object"
        ? {
            groupBuy: {
              enabled: Boolean(
                (data["discountRules"] as Record<string, unknown>)?.["groupBuy"]
                  ? (
                      (data["discountRules"] as Record<string, unknown>)[
                        "groupBuy"
                      ] as Record<string, unknown>
                    )["enabled"]
                  : false,
              ),
              minMembers: toNumber(
                (data["discountRules"] as Record<string, unknown>)?.["groupBuy"]
                  ? (
                      (data["discountRules"] as Record<string, unknown>)[
                        "groupBuy"
                      ] as Record<string, unknown>
                    )["minMembers"]
                  : 0,
                0,
              ),
              extraDiscountPercent: toNumber(
                (data["discountRules"] as Record<string, unknown>)?.["groupBuy"]
                  ? (
                      (data["discountRules"] as Record<string, unknown>)[
                        "groupBuy"
                      ] as Record<string, unknown>
                    )["extraDiscountPercent"]
                  : 0,
                0,
              ),
            },
          }
        : {
            groupBuy: {
              enabled: false,
              minMembers: 0,
              extraDiscountPercent: 0,
            },
          },
    productGroupQty: data["productGroupQty"] ?? {},
  };
};

// ─── mapEventListItem ─────────────────────────────────────────────────────────

export const mapEventListItem = (
  id: string,
  source: Record<string, unknown>,
): EventListItem => ({
  id,
  title: (source["title"] as string) ?? "",
  description: (source["description"] as string) ?? "",
  closingDate: (source["closingDate"] as string) ?? "",
  collectionDate: (source["collectionDate"] as string) ?? "",
  closingInText: (source["closingInText"] as string) ?? "closing in 2 hours",
  deliveryInText: (source["deliveryInText"] as string) ?? "Delivery in 6 days",
  buyCount: toNumber(source["buyCount"], 0),
  totalPurchase: (source["totalPurchase"] as string) ?? "$0.00",
  adminFee: (source["adminFee"] as string) ?? "$0.00",
  status: (source["status"] as EventStatus) ?? EVENT_STATUS.ACTIVE,
  userId: (source["userId"] as string) ?? "",
  hostUid: (source["hostUid"] as string) ?? "",
  hostDisplayName: (source["hostDisplayName"] as string) ?? "",
  updatedAt: (source["updatedAt"] as number) ?? null,
  bannerPreviewUrls: Array.isArray(source["bannerPreviewUrls"])
    ? (source["bannerPreviewUrls"] as string[])
    : [],
});

// ─── mapGroupEventListItem ────────────────────────────────────────────────────

export const mapGroupEventListItem = (
  id: string,
  source: Record<string, unknown>,
): GroupEventListItem => ({
  id,
  title: (source["title"] as string) ?? "",
  description: (source["description"] as string) ?? "",
  closingDate: (source["closingDate"] as string) ?? "",
  collectionDate: (source["collectionDate"] as string) ?? "",
  closingInText: (source["closingInText"] as string) ?? "closing in 2 hours",
  deliveryInText: (source["deliveryInText"] as string) ?? "Delivery in 6 days",
  buyCount: toNumber(source["buyCount"], 0),
  totalPurchase: (source["totalPurchase"] as string) ?? "$0.00",
  adminFee: (source["adminFee"] as string) ?? "$0.00",
  status: (source["status"] as EventStatus) ?? EVENT_STATUS.ACTIVE,
  groupId: (source["groupId"] as string) ?? "",
  groupName: (source["groupName"] as string) ?? "",
  hostDisplayName: (source["hostDisplayName"] as string) ?? "",
  updatedAt: (source["updatedAt"] as number) ?? null,
  bannerPreviewUrls: Array.isArray(source["bannerPreviewUrls"])
    ? (source["bannerPreviewUrls"] as string[])
    : [],
});

// ─── mapEventProductItem ──────────────────────────────────────────────────────

export const mapEventProductItem = (
  item: Record<string, unknown>,
  index: number,
  productGroupQtyMap: Record<string, unknown>,
): EventProductItem => {
  const itemName = typeof item["name"] === "string" ? item["name"].trim() : "";
  const itemDescription =
    typeof item["description"] === "string" ? item["description"].trim() : "";
  const basePrice = toPriceNumber(item["price"]);
  const rawOptions = Array.isArray(item["options"]) ? item["options"] : [];

  const mappedOptionGroups = (rawOptions as unknown[])
    .map((optionGroup: unknown, groupIndex: number) => {
      if (!optionGroup || typeof optionGroup !== "object") {
        if (typeof optionGroup === "string" && optionGroup.trim()) {
          return {
            id: `group-${groupIndex + 1}`,
            name: "Options",
            required: false,
            choices: [
              {
                id: `choice-${groupIndex + 1}-1`,
                name: optionGroup.trim(),
                price: 0,
              },
            ],
          };
        }
        return null;
      }

      const og = optionGroup as Record<string, unknown>;

      if (Array.isArray(og["choices"])) {
        const choices = (og["choices"] as unknown[])
          .map((choice: unknown, choiceIndex: number) => {
            if (!choice || typeof choice !== "object") return null;
            const c = choice as Record<string, unknown>;
            const choiceName =
              typeof c["name"] === "string"
                ? c["name"].trim()
                : typeof c["value"] === "string"
                  ? c["value"].trim()
                  : "";
            if (!choiceName) return null;
            return {
              id:
                typeof c["id"] === "string" && c["id"].trim()
                  ? c["id"].trim()
                  : `choice-${groupIndex + 1}-${choiceIndex + 1}`,
              name: choiceName,
              price: toPriceNumber(c["price"]),
            };
          })
          .filter(Boolean) as { id: string; name: string; price: number }[];

        if (choices.length === 0) return null;

        return {
          id:
            typeof og["id"] === "string" && og["id"].trim()
              ? og["id"].trim()
              : `group-${groupIndex + 1}`,
          name:
            typeof og["name"] === "string" && og["name"].trim()
              ? og["name"].trim()
              : `Option ${groupIndex + 1}`,
          required: Boolean(og["required"]),
          choices,
        };
      }

      if (typeof og["value"] === "string" && og["value"].trim()) {
        return {
          id: `group-${groupIndex + 1}`,
          name: "Options",
          required: false,
          choices: [
            {
              id:
                typeof og["id"] === "string" && og["id"].trim()
                  ? og["id"].trim()
                  : `choice-${groupIndex + 1}-1`,
              name: og["value"].trim(),
              price: 0,
            },
          ],
        };
      }

      return null;
    })
    .filter(Boolean) as EventProductItem["optionGroups"];

  const fallbackOptionChipValues = mappedOptionGroups
    .flatMap((group) => group.choices.map((choice) => choice.name))
    .slice(0, 6);

  const itemId =
    typeof item["id"] === "string" && item["id"].trim()
      ? item["id"].trim()
      : `item-${index + 1}`;

  return {
    id: itemId,
    name: itemName || `Item ${index + 1}`,
    description: itemDescription,
    normalPrice: basePrice,
    basePrice,
    price: `$${basePrice.toFixed(2)}`,
    groupPrice: toPriceNumber(item["groupPrice"]),
    groupDiscountPercent: toPriceNumber(item["groupDiscountPercent"]),
    qtyThreshold: Number.isFinite(Number(item["qtyThreshold"]))
      ? Number(item["qtyThreshold"])
      : 0,
    stock: Number.isFinite(Number(item["stock"])) ? Number(item["stock"]) : 0,
    totalGroupQty:
      typeof item["id"] === "string" && item["id"].trim()
        ? toNumber(productGroupQtyMap[item["id"].trim()], 0)
        : 0,
    imagePreviewUrl:
      typeof item["imagePreviewUrl"] === "string"
        ? item["imagePreviewUrl"]
        : "",
    options: fallbackOptionChipValues,
    optionGroups: mappedOptionGroups,
  };
};
