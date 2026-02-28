import { PackageOpen } from "lucide-react";
import { APP_PATHS } from "../../../../app/route-config";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  EmptyState,
  SectionCard,
  Skeleton,
} from "../../../../shared/components/ui";
import AppLayout from "../../../../shared/layouts/app-layout";
import EventDetailProductCard from "../../components/event-detail-product-card";
import { useEventDetailPage } from "../../hooks/use-event-detail-page";
import styles from "./index.module.scss";

export const routePath = APP_PATHS.eventDetail;

function EventDetailPage() {
  const viewModel = useEventDetailPage();

  return (
    <AppLayout>
      <section className={styles.page} data-event-id={viewModel.eventId}>
        <section className={styles.mainColumn}>
          <header className={styles.header}>
            {viewModel.bannerPreviewUrl ? (
              <img
                src={viewModel.bannerPreviewUrl}
                alt={viewModel.title}
                className={styles.banner}
              />
            ) : null}

            <SectionCard className={styles.headerCard}>
              <div className={styles.titleRow}>
                <h2>{viewModel.title}</h2>
                <Badge tone="default">{viewModel.status}</Badge>
              </div>

              <p>{viewModel.description || "No description"}</p>

              <div className={styles.countdown}>{viewModel.closingInText}</div>

              <div className={styles.metaRow}>
                <span>Closing: {viewModel.closingDate}</span>
                <span>
                  Collection: {viewModel.collectionDate}{" "}
                  {viewModel.collectionTime}
                </span>
                <span>Pickup: {viewModel.pickupLocation}</span>
              </div>

              <div className={styles.hostRow}>
                <Avatar name={viewModel.hostDisplayName} size={36} />
                <div>
                  <p>{viewModel.hostDisplayName}</p>
                  <small>{viewModel.joinedCount} people joined</small>
                </div>
              </div>

              {viewModel.importantNotes.length > 0 ? (
                <ul className={styles.notes}>
                  {viewModel.importantNotes.map((note, index) => (
                    <li key={`${note}-${index}`}>{note}</li>
                  ))}
                </ul>
              ) : null}
            </SectionCard>
          </header>

          {viewModel.error ? (
            <Alert tone="error">{viewModel.error}</Alert>
          ) : null}
          {viewModel.infoMessage ? (
            <Alert tone="success">{viewModel.infoMessage}</Alert>
          ) : null}

          {viewModel.isLoading ? (
            <div className={styles.loadingList}>
              <SectionCard className={styles.loadingCard}>
                <Skeleton height={20} width="48%" />
                <Skeleton height={14} width="86%" />
                <Skeleton height={14} width="68%" />
              </SectionCard>
              <SectionCard className={styles.loadingCard}>
                <Skeleton height={20} width="42%" />
                <Skeleton height={14} width="80%" />
                <Skeleton height={14} width="72%" />
              </SectionCard>
            </div>
          ) : null}

          {!viewModel.isLoading ? (
            <>
              {viewModel.products.length === 0 ? (
                <SectionCard>
                  <EmptyState
                    icon={<PackageOpen />}
                    title="Chưa có sản phẩm nào"
                    description="Event này chưa đăng sản phẩm để buyer đặt hàng."
                    actions={
                      <Button type="button" variant="secondary">
                        Invite friends
                      </Button>
                    }
                  />
                </SectionCard>
              ) : (
                <div className={styles.productList}>
                  {viewModel.products.map((product) => (
                    <EventDetailProductCard
                      key={product.id}
                      product={product}
                      onAddToOrder={viewModel.onAddToOrder}
                    />
                  ))}
                </div>
              )}
            </>
          ) : null}

          <section className={styles.checkoutBar}>
            <Button
              type="button"
              variant="secondary"
              className={styles.backBtn}
              onClick={viewModel.onBackToEvents}
            >
              Back to my events
            </Button>

            <div>
              <p>{viewModel.orderItemCount} items</p>
              <strong>Selected for checkout</strong>
            </div>
            <Button
              type="button"
              variant="primary"
              disabled={!viewModel.canProceedCheckout}
              onClick={viewModel.onProceedCheckout}
            >
              Checkout
            </Button>
          </section>
        </section>
      </section>
    </AppLayout>
  );
}

export default EventDetailPage;
