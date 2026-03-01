import {
  AlertTriangle,
  Ban,
  Minus,
  Plus,
  ShoppingBag,
  ShoppingCart,
} from "lucide-react";
import { useEventProductOrderForm } from "../../hooks/use-event-product-order-form";
import {
  EventAddToOrderPayload,
  EventDetailCartLineItem,
  EventDetailProductItem,
} from "../../types/event-detail-page-types";
import styles from "./index.module.scss";

interface EventDetailProductCardProps {
  product: EventDetailProductItem;
  onAddToOrder: (payload: EventAddToOrderPayload) => void;
  /** How many of this product the current user already has in their cart */
  cartQty?: number;
  /** All cart lines for this product — used to restore previously selected options */
  cartLines?: EventDetailCartLineItem[];
}

/**
 * Derives initial option selections from the most-recently added cart line so
 * that previously chosen options are pre-ticked when the user returns to the page.
 */
function deriveInitialSelections(
  cartLines: EventDetailCartLineItem[],
  mergedGroups: EventDetailProductItem["optionGroups"],
): { required: Record<string, string>; optional: Record<string, string[]> } {
  if (cartLines.length === 0) return { required: {}, optional: {} };

  const lastLine = cartLines[cartLines.length - 1];
  const selectedChoiceIds = new Set(lastLine.selectedChoices.map((c) => c.id));

  const required: Record<string, string> = {};
  const optional: Record<string, string[]> = {};

  for (const group of mergedGroups) {
    const matchingIds = group.choices
      .filter((c) => selectedChoiceIds.has(c.id))
      .map((c) => c.id);
    if (matchingIds.length === 0) continue;
    if (group.required) {
      required[group.id] = matchingIds[0];
    } else {
      optional[group.id] = matchingIds;
    }
  }

  return { required, optional };
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
  cartLines = [],
}: EventDetailProductCardProps) {
  const isOutOfStock = product.stockStatus === "out-of-stock";
  const isLowStock = product.stockStatus === "low-stock";

  // Max the user can still add without exceeding remaining stock
  const maxAddable = Number.isFinite(product.availableQty)
    ? Math.max(0, product.availableQty - cartQty)
    : Number.POSITIVE_INFINITY;

  // Merged groups must be computed before the hook so initial selections use
  // the same group IDs that the UI later exposes to the form state.
  const mergedOptionGroups = mergeOptionGroupsByName(product.optionGroups);

  // Stable initial selections — derived once on mount from the last cart line.
  // React Hook Form only reads `defaultValues` once, so recomputations on
  // subsequent renders are harmless.
  const { required: initialRequired, optional: initialOptional } =
    deriveInitialSelections(cartLines, mergedOptionGroups);

  const viewModel = useEventProductOrderForm({
    product,
    maxQty: Number.isFinite(maxAddable) ? maxAddable : undefined,
    onSubmitAddToOrder: onAddToOrder,
    initialRequiredSelections: initialRequired,
    initialOptionalSelections: initialOptional,
  });

  return (
    <div
      className={[styles.card, isOutOfStock ? styles.cardOutOfStock : ""]
        .filter(Boolean)
        .join(" ")}
    >
      {/* ── Image block ────────────────────────────────────────────────────── */}
      {product.imagePreviewUrl ? (
        <div className={styles.imageWrapper}>
          <img
            src={product.imagePreviewUrl}
            alt={product.name}
            className={styles.image}
          />
          {/* Price badge overlaid on image */}
          <span className={styles.priceBadge}>{viewModel.totalPriceText}</span>
          {isOutOfStock ? (
            <div className={styles.outOfStockOverlay}>
              <Ban size={22} />
              <span>Out of Stock</span>
            </div>
          ) : null}
        </div>
      ) : (
        /* Gradient header when no image */
        <div className={styles.noImageHeader}>
          <div className={styles.noImageTitleRow}>
            <h3 className={styles.noImageTitle}>{product.name}</h3>
            <span className={styles.noImagePrice}>
              {viewModel.totalPriceText}
            </span>
          </div>
          {isOutOfStock ? (
            <span className={styles.outOfStockBannerNoImage}>
              <Ban size={13} /> Out of Stock
            </span>
          ) : null}
        </div>
      )}

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div className={styles.content}>
        {/* Title row — only shown when there is an image */}
        {product.imagePreviewUrl ? (
          <div className={styles.titleRow}>
            <h3>{product.name}</h3>
          </div>
        ) : null}

        {product.description ? (
          <p className={styles.description}>{product.description}</p>
        ) : null}

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

        {/* Option groups — pill toggles */}
        {mergedOptionGroups.map((optionGroup) => (
          <section className={styles.optionGroup} key={optionGroup.id}>
            <div className={styles.optionHeader}>
              <h4>{optionGroup.name}</h4>
              {optionGroup.required ? (
                <span className={styles.requiredBadge}>Required</span>
              ) : null}
            </div>

            <div className={styles.pillGroup}>
              {optionGroup.choices.map((choice) => {
                const isSelected = optionGroup.required
                  ? viewModel.requiredSelectionMap[optionGroup.id] === choice.id
                  : (
                      viewModel.selectedOptionalMap[optionGroup.id] ?? []
                    ).includes(choice.id);

                return (
                  <button
                    key={choice.id}
                    type="button"
                    className={[
                      styles.pill,
                      isSelected ? styles.pillActive : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() =>
                      optionGroup.required
                        ? viewModel.onSelectRequiredChoice(
                            optionGroup.id,
                            choice.id,
                          )
                        : viewModel.onToggleOptionalChoice(
                            optionGroup.id,
                            choice.id,
                          )
                    }
                  >
                    <span>{choice.name}</span>
                    {choice.price > 0 ? (
                      <span className={styles.pillPrice}>
                        +${choice.price.toFixed(2)}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            {optionGroup.required &&
            viewModel.requiredErrors[optionGroup.id] ? (
              <p className={styles.optionError}>
                {viewModel.requiredErrors[optionGroup.id]}
              </p>
            ) : null}
          </section>
        ))}

        {/* Action row */}
        <div className={styles.actionRow}>
          <div className={styles.quantityRow}>
            <button
              type="button"
              className={styles.qtyBtn}
              onClick={viewModel.onDecreaseQuantity}
              disabled={isOutOfStock}
            >
              <Minus size={13} />
            </button>
            <span>{viewModel.quantity}</span>
            <button
              type="button"
              className={styles.qtyBtn}
              onClick={viewModel.onIncreaseQuantity}
              disabled={isOutOfStock || viewModel.quantity >= maxAddable}
            >
              <Plus size={13} />
            </button>
          </div>

          <button
            type="button"
            className={[
              styles.addBtn,
              isOutOfStock || maxAddable <= 0 ? styles.addBtnDisabled : "",
            ]
              .filter(Boolean)
              .join(" ")}
            disabled={isOutOfStock || maxAddable <= 0}
            onClick={viewModel.onAddToOrder}
          >
            {isOutOfStock ? (
              <>
                <Ban size={14} /> Out of Stock
              </>
            ) : (
              <>
                <ShoppingCart size={15} /> Add
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EventDetailProductCard;
