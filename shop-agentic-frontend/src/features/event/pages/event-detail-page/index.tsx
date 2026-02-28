import {
  CalendarDays,
  ChevronLeft,
  ClockAlert,
  MapPin,
  PackageOpen,
  RefreshCw,
  ShoppingCart,
  Truck,
  Users,
} from "lucide-react";
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
  const vm = useEventDetailPage();

  return (
    <AppLayout>
      <div className={styles.page} data-event-id={vm.eventId}>
        {}
        <div className={styles.hero}>
          {vm.bannerPreviewUrl ? (
            <img
              src={vm.bannerPreviewUrl}
              alt={vm.title}
              className={styles.heroBg}
            />
          ) : (
            <div className={styles.heroBgFallback} />
          )}
          <div className={styles.heroOverlay} />
          <div className={styles.heroContent}>
            {vm.isLoading ? (
              <>
                <Skeleton height={22} width="60%" />
                <Skeleton height={16} width="30%" />
              </>
            ) : (
              <>
                <h1 className={styles.heroTitle}>{vm.title}</h1>
                <div className={styles.heroBadgeRow}>
                  <Badge tone={vm.isClosed ? "danger" : "success"}>
                    {vm.status}
                  </Badge>
                  {vm.groupName ? (
                    <span className={styles.groupPill}>
                      <Users size={11} />
                      {vm.groupName}
                    </span>
                  ) : null}
                </div>
              </>
            )}
          </div>
        </div>

        {}
        {vm.isClosed && !vm.isLoading ? (
          <div className={styles.closedStrip}>
            <ClockAlert size={15} />
            <span>This event has closed — orders are no longer accepted</span>
          </div>
        ) : null}

        {}
        {vm.error ? <Alert tone="error">{vm.error}</Alert> : null}
        {vm.infoMessage ? <Alert tone="success">{vm.infoMessage}</Alert> : null}

        {}
        {!vm.isLoading ? (
          <SectionCard className={styles.hostCard}>
            <div className={styles.hostRow}>
              <Avatar name={vm.hostDisplayName} size={38} />
              <div className={styles.hostInfo}>
                <span className={styles.hostName}>{vm.hostDisplayName}</span>
                <span className={styles.hostMeta}>
                  {vm.joinedCount} {vm.joinedCount === 1 ? "person" : "people"}{" "}
                  joined
                </span>
              </div>
              <span className={styles.adminFee}>
                Fee&nbsp;
                <strong>{vm.adminFeeText}</strong>
              </span>
            </div>
          </SectionCard>
        ) : null}

        {}
        {!vm.isLoading ? (
          <div className={styles.metaGrid}>
            <div
              className={[
                styles.metaChip,
                vm.isClosed ? styles.metaChipClosed : styles.metaChipCountdown,
              ].join(" ")}
            >
              <CalendarDays size={14} />
              <div>
                <span className={styles.metaLabel}>
                  {vm.isClosed ? "Closed" : "Closes"}
                </span>
                <span className={styles.metaValue}>
                  {vm.closingDate !== "-" ? vm.closingDate : vm.closingInText}
                </span>
              </div>
            </div>
            <div className={styles.metaChip}>
              <Truck size={14} />
              <div>
                <span className={styles.metaLabel}>Collection</span>
                <span className={styles.metaValue}>
                  {vm.collectionDate !== "-" ? vm.collectionDate : "TBA"}
                  {vm.collectionTime && vm.collectionTime !== "-"
                    ? " · " + vm.collectionTime
                    : ""}
                </span>
              </div>
            </div>
            <div className={styles.metaChip}>
              <MapPin size={14} />
              <div>
                <span className={styles.metaLabel}>Pickup</span>
                <span className={styles.metaValue}>
                  {vm.pickupLocation !== "-" ? vm.pickupLocation : "TBA"}
                </span>
              </div>
            </div>
          </div>
        ) : null}

        {}
        {!vm.isLoading && vm.description ? (
          <SectionCard className={styles.descCard}>
            <p className={styles.descText}>{vm.description}</p>
          </SectionCard>
        ) : null}

        {}
        {!vm.isLoading && vm.importantNotes.length > 0 ? (
          <SectionCard className={styles.notesCard}>
            <h4 className={styles.sectionLabel}>Important notes</h4>
            <ul className={styles.notesList}>
              {vm.importantNotes.map((note, i) => (
                <li key={i}>{note}</li>
              ))}
            </ul>
          </SectionCard>
        ) : null}

        {}
        <div className={styles.productsSection}>
          <h4 className={styles.sectionLabel}>Products</h4>

          {vm.isLoading ? (
            <div className={styles.productLoadingGrid}>
              {[0, 1].map((i) => (
                <SectionCard key={i} className={styles.loadingCard}>
                  <Skeleton height={18} width="52%" />
                  <Skeleton height={14} width="85%" />
                  <Skeleton height={14} width="65%" />
                  <Skeleton height={32} width="45%" />
                </SectionCard>
              ))}
            </div>
          ) : null}

          {!vm.isLoading && vm.products.length === 0 ? (
            <SectionCard>
              <EmptyState
                icon={<PackageOpen />}
                title="No products yet"
                description="The host hasn't added any products to this event."
              />
            </SectionCard>
          ) : null}

          {!vm.isLoading && vm.products.length > 0 ? (
            <div
              className={[
                styles.productGrid,
                vm.isClosed ? styles.productGridClosed : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {vm.products.map((product) => (
                <EventDetailProductCard
                  key={product.id}
                  product={product}
                  onAddToOrder={vm.onAddToOrder}
                />
              ))}
            </div>
          ) : null}
        </div>

        {}
        <div className={styles.checkoutBar}>
          <Button
            type="button"
            variant="secondary"
            className={styles.backBtn}
            onClick={vm.onBackToEvents}
          >
            <ChevronLeft size={14} />
            Back
          </Button>

          {vm.isClosed ? (
            <Button
              type="button"
              variant="primary"
              className={styles.rehostBtn}
              disabled={vm.isReHosting}
              onClick={vm.onReHost}
            >
              <RefreshCw size={14} />
              {vm.isReHosting ? "Creating..." : "Re-host event"}
            </Button>
          ) : (
            <button
              type="button"
              className={[
                styles.cartBtn,
                vm.canProceedCheckout ? styles.cartBtnActive : "",
              ]
                .filter(Boolean)
                .join(" ")}
              disabled={!vm.canProceedCheckout}
              onClick={vm.onProceedCheckout}
            >
              <ShoppingCart size={16} />
              <span className={styles.cartLabel}>
                {vm.orderItemCount > 0
                  ? `Checkout (${vm.orderItemCount})`
                  : "Add items to checkout"}
              </span>
            </button>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

export default EventDetailPage;
