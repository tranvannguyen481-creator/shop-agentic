import { Minus, Plus, ShoppingCart } from "lucide-react";
import { FormError } from "../../../../shared/components/form";
import {
  Button,
  Checkbox,
  RadioGroup,
  SectionCard,
} from "../../../../shared/components/ui";
import { useEventProductOrderForm } from "../../hooks/use-event-product-order-form";
import {
  EventAddToOrderPayload,
  EventDetailProductItem,
} from "../../types/event-detail-page-types";
import styles from "./index.module.scss";

interface EventDetailProductCardProps {
  product: EventDetailProductItem;
  onAddToOrder: (payload: EventAddToOrderPayload) => void;
}

function EventDetailProductCard({
  product,
  onAddToOrder,
}: EventDetailProductCardProps) {
  const viewModel = useEventProductOrderForm({
    product,
    onSubmitAddToOrder: onAddToOrder,
  });

  return (
    <SectionCard className={styles.card}>
      {product.imagePreviewUrl ? (
        <img
          src={product.imagePreviewUrl}
          alt={product.name}
          className={styles.image}
        />
      ) : null}

      <div className={styles.content}>
        <div className={styles.titleRow}>
          <h3>{product.name}</h3>
          <strong>{viewModel.totalPriceText}</strong>
        </div>

        <p className={styles.description}>
          {product.description || "No description"}
        </p>

        {product.optionGroups.map((optionGroup) => (
          <section className={styles.optionGroup} key={optionGroup.id}>
            <div className={styles.optionHeader}>
              <h4>{optionGroup.name}</h4>
              {optionGroup.required ? <span>* Required</span> : null}
            </div>

            {optionGroup.required ? (
              <RadioGroup
                name={`${product.id}-${optionGroup.id}`}
                options={optionGroup.choices.map((choice) => ({
                  label:
                    choice.price > 0
                      ? `${choice.name} (+$${choice.price.toFixed(2)})`
                      : choice.name,
                  value: choice.id,
                }))}
                value={viewModel.requiredSelectionMap[optionGroup.id] ?? ""}
                onChange={(choiceId) =>
                  viewModel.onSelectRequiredChoice(optionGroup.id, choiceId)
                }
                wrapperClassName={styles.radioWrap}
              />
            ) : (
              <div className={styles.checkboxList}>
                {optionGroup.choices.map((choice) => {
                  const selectedValues =
                    viewModel.selectedOptionalMap[optionGroup.id] ?? [];

                  return (
                    <Checkbox
                      key={choice.id}
                      label={
                        choice.price > 0
                          ? `${choice.name} (+$${choice.price.toFixed(2)})`
                          : choice.name
                      }
                      checked={selectedValues.includes(choice.id)}
                      onChange={() =>
                        viewModel.onToggleOptionalChoice(
                          optionGroup.id,
                          choice.id,
                        )
                      }
                    />
                  );
                })}
              </div>
            )}

            {optionGroup.required ? (
              <FormError
                error={
                  viewModel.requiredErrors[optionGroup.id]
                    ? ({
                        message: viewModel.requiredErrors[optionGroup.id] || "",
                      } as never)
                    : undefined
                }
              />
            ) : null}
          </section>
        ))}

        <div className={styles.actionRow}>
          <div className={styles.quantityRow}>
            <Button
              type="button"
              variant="outline"
              onClick={viewModel.onDecreaseQuantity}
            >
              <Minus size={14} /> <span>−</span>
            </Button>
            <span>{viewModel.quantity}</span>
            <Button
              type="button"
              variant="outline"
              onClick={viewModel.onIncreaseQuantity}
            >
              <Plus size={14} /> <span>+</span>
            </Button>
          </div>

          <Button
            type="button"
            variant="primary"
            onClick={viewModel.onAddToOrder}
          >
            <ShoppingCart size={16} /> Add to Order
          </Button>
        </div>
      </div>
    </SectionCard>
  );
}

export default EventDetailProductCard;
