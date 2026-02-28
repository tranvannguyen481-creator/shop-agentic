import {
  EventDetailProductItem,
  EventDetailProductOptionChoice,
  EventDetailProductOptionGroup,
} from "../types/event-detail-page-types";

export const toCurrency = (value: number) => `$${value.toFixed(2)}`;

export const toAdminFeeValue = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^\d.-]/g, "").trim());
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

export const toProductItem = (
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

  const basePriceRaw = Number(
    item.basePrice ?? item.normalPrice ?? item.price ?? 0,
  );
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
    normalPrice: Number(item.normalPrice ?? basePrice) || basePrice,
    basePrice,
    price: priceText,
    groupPrice: Number(item.groupPrice ?? 0) || undefined,
    groupDiscountPercent: Number(item.groupDiscountPercent ?? 0) || undefined,
    qtyThreshold: Number(item.qtyThreshold ?? 0) || undefined,
    stock: Number(item.stock ?? 0) || undefined,
    totalGroupQty: Number(item.totalGroupQty ?? 0),
    imagePreviewUrl:
      typeof item.imagePreviewUrl === "string" ? item.imagePreviewUrl : "",
    options: rawOptions
      .map((option) => (typeof option === "string" ? option : ""))
      .filter(Boolean),
    optionGroups,
  };
};
