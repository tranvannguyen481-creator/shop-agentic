import { APP_PATHS } from "../../../../app/route-config";
import {
  Alert,
  Button,
  EmptyState,
  SectionCard,
} from "../../../../shared/components/ui";
import AppLayout from "../../../../shared/layouts/app-layout";
import { useEventCheckoutPage } from "../../hooks/use-event-checkout-page";
import styles from "./index.module.scss";

export const routePath = APP_PATHS.eventCheckout;

function EventCheckoutPage() {
  const viewModel = useEventCheckoutPage();

  return (
    <AppLayout>
      <section className={styles.page} data-event-id={viewModel.eventId}>
        <header className={styles.header}>
          <h2>Checkout</h2>
          <p>{viewModel.itemCount} items selected</p>
        </header>

        {viewModel.infoMessage ? (
          <Alert tone="success">{viewModel.infoMessage}</Alert>
        ) : null}

        {!viewModel.hasItems ? (
          <SectionCard>
            <EmptyState
              icon={<span>🛒</span>}
              title="No items selected"
              description="Please choose products from event detail before checkout."
              actions={
                <Button
                  type="button"
                  variant="primary"
                  onClick={viewModel.onBackToDetail}
                >
                  Back to event detail
                </Button>
              }
            />
          </SectionCard>
        ) : (
          <>
            <div className={styles.list}>
              {viewModel.items.map((item, index) => (
                <SectionCard
                  key={`${item.productId}-${index}`}
                  className={styles.lineCard}
                >
                  <div className={styles.titleRow}>
                    <strong>{item.name}</strong>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                  <p>Qty: {item.quantity}</p>
                  {item.selectedChoices.length > 0 ? (
                    <p>{item.selectedChoices.join(", ")}</p>
                  ) : null}
                </SectionCard>
              ))}
            </div>

            <SectionCard className={styles.summary}>
              <p>
                <span>Subtotal</span>
                <strong>{viewModel.subtotalText}</strong>
              </p>
              <Button type="button" onClick={viewModel.onPlaceOrder}>
                Place order
              </Button>
            </SectionCard>
          </>
        )}
      </section>
    </AppLayout>
  );
}

export default EventCheckoutPage;
