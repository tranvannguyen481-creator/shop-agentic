import {
  AlertTriangle,
  Ban,
  Minus,
  Plus,
  ShoppingBag,
  ShoppingCart,
} from "lucide-react";
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
  /** How many of this product the current user already has in their cart */
  cartQty?: number;
}

// Merge option groups that share the same name so the heading is shown only once.
function mergeOptionGroupsByName(
  groups: EventDetailProductItem["optionGroups"],
): EventDetailProductItem["optionGroups"] {
  const seen = new Map<string, (typeof groups)[number]>();
  for (const group of groups) {
    const key = group.name.trim().toLowerCase();
    if (seen.has(key)) {
      const existing = seen.get(key)!;
      seen.set(key, {
        ...existing,
        choices: [...existing.choices, ...group.choices],
      });
    } else {
      seen.set(key, { ...group, choices: [...group.choices] });
    }
  }
  return Array.from(seen.values());
}

function EventDetailProductCard({
  product,
  onAddToOrder,
  cartQty = 0,
}: EventDetailProductCardProps) {
  const isOutOfStock = product.stockStatus === "out-of-stock";
  const isLowStock = product.stockStatus === "low-stock";

  // Max the user can still add without exceeding remaining stock
  const maxAddable = Number.isFinite(product.availableQty)
    ? Math.max(0, product.availableQty - cartQty)
    : Number.POSITIVE_INFINITY;

  const viewModel = useEventProductOrderForm({
    product,
    maxQty: Number.isFinite(maxAddable) ? maxAddable : undefined,
    onSubmitAddToOrder: onAddToOrder,
  });

  const mergedOptionGroups = mergeOptionGroupsByName(product.optionGroups);

  return (
    <SectionCard
      className={[styles.card, isOutOfStock ? styles.cardOutOfStock : ""]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Image + out-of-stock overlay */}
      {product.imagePreviewUrl ? (
        <div className={styles.imageWrapper}>
          <img
            src={product.imagePreviewUrl}
            alt={product.name}
            className={styles.image}
          />
          {isOutOfStock ? (
            <div className={styles.outOfStockOverlay}>
              <Ban size={22} />
              <span>Out of Stock</span>
            </div>
          ) : null}
        </div>
      ) : isOutOfStock ? (
        <div className={styles.outOfStockBannerNoImage}>
          <Ban size={16} /> Out of Stock
        </div>
      ) : null}

      <div className={styles.content}>
        <div className={styles.titleRow}>
          <h3>{product.name}</h3>
          <strong>{viewModel.totalPriceText}</strong>
        </div>

        <p className={styles.description}>
          {product.description || "No description"}
        </p>

        {/* Live stats */}
        {product.totalGroupQty > 0 || cartQty > 0 || isLowStock ? (
          <div className={styles.statsRow}>
            {product.totalGroupQty > 0 ? (
              <span className={styles.orderedPill}>
                <ShoppingBag size={11} />
                {product.totalGroupQty} ordered
              </span>
            ) : null}
            {cartQty > 0 ? (
              <span className={styles.cartPill}>
                <ShoppingCart size={11} />
                In cart: {cartQty}
              </span>
            ) : null}
            {isLowStock ? (
              <span className={styles.lowStockPill}>
                <AlertTriangle size={11} />
                Only {product.availableQty} left
              </span>
            ) : null}
          </div>
        ) : null}

        {mergedOptionGroups.map((optionGroup) => (
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
              disabled={isOutOfStock}
            >
              <Minus size={14} />
            </Button>
            <span>{viewModel.quantity}</span>
            <Button
              type="button"
              variant="outline"
              onClick={viewModel.onIncreaseQuantity}
              disabled={isOutOfStock || viewModel.quantity >= maxAddable}
            >
              <Plus size={14} />
            </Button>
          </div>

          <Button
            type="button"
            variant="primary"
            onClick={viewModel.onAddToOrder}
            disabled={isOutOfStock || maxAddable <= 0}
          >
            {isOutOfStock ? (
              <>
                <Ban size={14} /> Out of Stock
              </>
            ) : (
              <>
                <ShoppingCart size={16} /> Add to Order
              </>
            )}
          </Button>
        </div>
      </div>
    </SectionCard>
  );
}

export default EventDetailProductCard;
