import { CalendarDays, MapPin, Truck } from "lucide-react";
import { APP_PATHS } from "../../../../app/route-config";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Chip,
  Divider,
  Modal,
  SectionCard,
  ZoomImage,
} from "../../../../shared/components/ui";
import { useCurrentUserQuery } from "../../../../shared/hooks/use-current-user-query";
import { useCreatedConfirm } from "../../hooks/use-created-confirm";
import EventStepNavigation from "../event-step-navigation";
import styles from "./index.module.scss";

const formatDate = (isoOrDisplay: string): string => {
  if (!isoOrDisplay) return "—";
  // already formatted (e.g. DD-MM-YYYY)
  if (/^\d{2}-\d{2}-\d{4}$/.test(isoOrDisplay)) return isoOrDisplay;
  // try to parse ISO (YYYY-MM-DD)
  const d = new Date(isoOrDisplay);
  if (Number.isNaN(d.getTime())) return isoOrDisplay;
  return d.toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const modeLabel: Record<string, string> = {
  "group-buy": "GroupBuy",
};

function CreatedConfirmView() {
  const vm = useCreatedConfirm();
  const { data: currentUser } = useCurrentUserQuery();
  const hostName = currentUser?.displayName ?? currentUser?.email ?? "You";

  return (
    <section className={styles.page}>
      {/* ── Event header card ─────────────────────────────────────── */}
      <SectionCard className={styles.eventCard}>
        <div className={styles.eventHead}>
          <div className={styles.sellerWrap}>
            <Avatar name={hostName} size={40} />
            <div>
              <p className={styles.sellerName}>{hostName}</p>
              <p className={styles.sellerMeta}>
                {modeLabel[vm.mode] ?? vm.mode}
              </p>
            </div>
          </div>
          <div className={styles.buyWrap}>
            <Badge tone="success">Draft</Badge>
          </div>
        </div>

        <h2 className={styles.eventTitle}>{vm.title}</h2>

        <dl className={styles.metaList}>
          {vm.closingDate ? (
            <div>
              <dt>
                <CalendarDays size={13} />
                Closing
              </dt>
              <dd>{formatDate(vm.closingDate)}</dd>
            </div>
          ) : null}
          {vm.collectionDate ? (
            <div>
              <dt>
                <Truck size={13} />
                Collection
              </dt>
              <dd>
                {formatDate(vm.collectionDate)}
                {vm.collectionTime ? " · " + vm.collectionTime : ""}
              </dd>
            </div>
          ) : null}
          {vm.pickupLocation ? (
            <div>
              <dt>
                <MapPin size={13} />
                Pickup
              </dt>
              <dd>{vm.pickupLocation}</dd>
            </div>
          ) : null}
        </dl>

        {vm.bannerPreviewUrls.length > 0 && (
          <div className={styles.bannerGallery}>
            {vm.bannerPreviewUrls.map((url, i) => (
              <ZoomImage
                key={i}
                src={url}
                alt={`Banner ${i + 1}`}
                className={styles.bannerThumb}
              />
            ))}
          </div>
        )}
      </SectionCard>

      {/* ── Items ─────────────────────────────────────────────────── */}
      {vm.items.length > 0 ? (
        <div className={styles.itemList}>
          {vm.items.map((item, i) => (
            <SectionCard key={i} className={styles.itemRow}>
              {item.imagePreviewUrl && (
                <ZoomImage
                  src={item.imagePreviewUrl}
                  alt={item.name}
                  className={styles.itemThumb}
                />
              )}
              <div className={styles.itemInfo}>
                <p className={styles.itemName}>{item.name}</p>

                {item.options.length > 0 && (
                  <div className={styles.itemOptions}>
                    {item.options.map((opt, oi) => (
                      <Chip key={oi}>{opt.value}</Chip>
                    ))}
                  </div>
                )}

                {item.optionGroups.length > 0 && (
                  <div className={styles.itemOptionGroups}>
                    {item.optionGroups.map((group, gi) => (
                      <div key={gi} className={styles.optionGroup}>
                        <span className={styles.optionGroupName}>
                          {group.name}
                          {group.required && (
                            <span className={styles.requiredBadge}>
                              Required
                            </span>
                          )}
                        </span>
                        <Divider />
                        <div className={styles.optionGroupChoices}>
                          {group.choices.map((choice, ci) => (
                            <Chip key={ci}>
                              {choice.name}
                              {choice.price > 0 && (
                                <span className={styles.choicePrice}>
                                  +${choice.price.toFixed(2)}
                                </span>
                              )}
                            </Chip>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <span className={styles.itemPrice}>{item.price}</span>
            </SectionCard>
          ))}
        </div>
      ) : null}

      {/* ── Summary ───────────────────────────────────────────────── */}
      <SectionCard className={styles.totalPanel}>
        <div className={styles.totalRow}>
          <span className={styles.totalLabel}>Admin fee per order</span>
          <span className={styles.totalValue}>
            {vm.adminFee && vm.adminFee !== "0" ? `$${vm.adminFee}` : "None"}
          </span>
        </div>
        <div className={styles.totalRow}>
          <span className={styles.totalLabel}>Items</span>
          <span className={styles.totalValue}>{vm.items.length}</span>
        </div>
      </SectionCard>

      <EventStepNavigation
        currentPath={APP_PATHS.createdConfirm}
        className={styles.actions}
        onNextClick={vm.handleOpenPublishModal}
      />

      {/* ── Publish modal ─────────────────────────────────────────── */}
      <Modal
        open={vm.isPublishModalOpen}
        onClose={vm.handleClosePublishModal}
        title="Publish Event"
        bodyClassName={styles.publishModalBody}
        footer={
          <div className={styles.publishModalActions}>
            <Button
              type="button"
              variant="outline"
              onClick={vm.handleClosePublishModal}
              disabled={vm.isPublishing}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={vm.handlePublish}
              disabled={vm.isPublishing}
            >
              {vm.isPublishing ? "Publishing..." : "Publish"}
            </Button>
          </div>
        }
      >
        <p className={styles.publishModalText}>
          Confirm publish event? This will clear all draft data in create-event
          process.
        </p>

        {vm.publishError ? (
          <Alert tone="error" className={styles.publishError}>
            {vm.publishError}
          </Alert>
        ) : null}
      </Modal>
    </section>
  );
}

export default CreatedConfirmView;
