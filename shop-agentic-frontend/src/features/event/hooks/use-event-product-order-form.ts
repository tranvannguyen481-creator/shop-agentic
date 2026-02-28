import { useMemo, useState } from "react";
import { FieldErrors } from "react-hook-form";
import { useSmartForm } from "../../../shared/components/form";
import { createEventDetailOrderSchema } from "../schemas/event-detail-order-schema";
import {
  EventAddToOrderPayload,
  EventDetailProductItem,
  EventProductOrderFormValues,
} from "../types/event-detail-page-types";

interface UseEventProductOrderFormParams {
  product: EventDetailProductItem;
  onSubmitAddToOrder: (payload: EventAddToOrderPayload) => void;
}

const buildRequiredErrorMap = (
  errors: FieldErrors<EventProductOrderFormValues>,
): Record<string, string | null> => {
  const source = (errors.requiredSelections ?? {}) as Record<string, unknown>;

  return Object.entries(source).reduce<Record<string, string | null>>(
    (accumulator, [groupId, value]) => {
      const message =
        value && typeof value === "object" && "message" in value
          ? String((value as { message?: unknown }).message ?? "")
          : "";

      accumulator[groupId] = message || null;
      return accumulator;
    },
    {},
  );
};

export const useEventProductOrderForm = ({
  product,
  onSubmitAddToOrder,
}: UseEventProductOrderFormParams) => {
  const requiredGroupIds = useMemo(
    () =>
      product.optionGroups
        .filter((group) => group.required)
        .map((group) => group.id),
    [product.optionGroups],
  );

  const form = useSmartForm<EventProductOrderFormValues>({
    schema: createEventDetailOrderSchema(requiredGroupIds),
    defaultValues: {
      quantity: 1,
      requiredSelections: {},
    },
  });

  const [selectedOptionalMap, setSelectedOptionalMap] = useState<
    Record<string, string[]>
  >({});

  const quantity = Number(form.watch("quantity") ?? 1);
  const watchedRequiredSelections = form.watch("requiredSelections");

  const requiredSelectionMap = useMemo(
    () => watchedRequiredSelections ?? {},
    [watchedRequiredSelections],
  );

  const selectedChoiceIds = useMemo(() => {
    const requiredChoiceIds = Object.values(requiredSelectionMap).filter(
      (value): value is string => Boolean(value),
    );

    const optionalChoiceIds = Object.values(selectedOptionalMap).flatMap(
      (choiceIds) => choiceIds,
    );

    return [...requiredChoiceIds, ...optionalChoiceIds];
  }, [requiredSelectionMap, selectedOptionalMap]);

  const selectedPrice = useMemo(() => {
    if (selectedChoiceIds.length === 0) {
      return 0;
    }

    const selectedSet = new Set(selectedChoiceIds);

    return product.optionGroups.reduce((total, optionGroup) => {
      const groupPrice = optionGroup.choices.reduce((groupTotal, choice) => {
        if (!selectedSet.has(choice.id)) {
          return groupTotal;
        }

        return groupTotal + Number(choice.price || 0);
      }, 0);

      return total + groupPrice;
    }, 0);
  }, [product.optionGroups, selectedChoiceIds]);

  const unitPrice = Number(product.basePrice || 0) + selectedPrice;
  const totalPrice = unitPrice * Math.max(quantity, 1);

  const requiredErrors = useMemo(
    () => buildRequiredErrorMap(form.formState.errors),
    [form.formState.errors],
  );

  const onSelectRequiredChoice = (groupId: string, choiceId: string) => {
    form.setValue(`requiredSelections.${groupId}`, choiceId, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  const onToggleOptionalChoice = (groupId: string, choiceId: string) => {
    setSelectedOptionalMap((previousMap) => {
      const currentGroupChoiceIds = previousMap[groupId] ?? [];
      const hasChoice = currentGroupChoiceIds.includes(choiceId);

      const nextGroupChoiceIds = hasChoice
        ? currentGroupChoiceIds.filter((currentId) => currentId !== choiceId)
        : [...currentGroupChoiceIds, choiceId];

      return {
        ...previousMap,
        [groupId]: nextGroupChoiceIds,
      };
    });
  };

  const onIncreaseQuantity = () => {
    form.setValue("quantity", Math.max(quantity, 1) + 1, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  const onDecreaseQuantity = () => {
    form.setValue("quantity", Math.max(1, quantity - 1), {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  const handleAddToOrder = () => {
    void form.handleSmartSubmit((values) => {
      onSubmitAddToOrder({
        product,
        quantity: Math.max(1, Number(values.quantity || 1)),
        selectedChoiceIds,
      });
    })();
  };

  return {
    form,
    quantity,
    selectedOptionalMap,
    requiredSelectionMap,
    requiredErrors,
    totalPriceText: `$${totalPrice.toFixed(2)}`,
    onSelectRequiredChoice,
    onToggleOptionalChoice,
    onIncreaseQuantity,
    onDecreaseQuantity,
    onAddToOrder: handleAddToOrder,
  };
};
