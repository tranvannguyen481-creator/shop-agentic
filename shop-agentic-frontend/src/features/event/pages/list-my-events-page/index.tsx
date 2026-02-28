import { CalendarDays, ShoppingBag, Truck } from "lucide-react";
import { APP_PATHS } from "../../../../app/route-config";
import SearchBar from "../../../../shared/components/search-bar";
import {
  Alert,
  Badge,
  Button,
  SectionCard,
  Skeleton,
} from "../../../../shared/components/ui";
import AppLayout from "../../../../shared/layouts/app-layout";
import { useListMyEventsPage } from "../../hooks/use-list-my-events-page";
import styles from "./index.module.scss";

export const routePath = APP_PATHS.listMyEvents;

function ListMyEventsPage() {
  const viewModel = useListMyEventsPage();

  const toStatusTone = (status: string | undefined) => {
    const normalizedStatus = String(status ?? "").toLowerCase();

    if (
      normalizedStatus.includes("close") ||
      normalizedStatus.includes("end")
    ) {
      return "danger" as const;
    }

    if (
      normalizedStatus.includes("draft") ||
      normalizedStatus.includes("pending")
    ) {
      return "warning" as const;
    }

    return "success" as const;
  };

  return (
    <AppLayout>
      <div className={styles.page}>
        <SearchBar
          value={viewModel.search}
          onValueChange={viewModel.onSearchChange}
        />
        {viewModel.isLoading ? (
          <div className={styles.loadingBlock}>
            <SectionCard className={styles.loadingCard}>
              <Skeleton height={22} width="52%" />
              <Skeleton height={16} width="92%" />
              <Skeleton height={16} width="84%" />
              <div className={styles.loadingActionRow}>
                <Skeleton height={34} />
                <Skeleton height={34} />
                <Skeleton height={34} />
              </div>
            </SectionCard>
            <SectionCard className={styles.loadingCard}>
              <Skeleton height={22} width="46%" />
              <Skeleton height={16} width="90%" />
              <Skeleton height={16} width="80%" />
              <div className={styles.loadingActionRow}>
                <Skeleton height={34} />
                <Skeleton height={34} />
                <Skeleton height={34} />
              </div>
            </SectionCard>
          </div>
        ) : null}

        {!viewModel.isLoading ? (
          <div className={styles.panel}>
            {viewModel.error ? (
              <Alert tone="error">{viewModel.error}</Alert>
            ) : null}

            {viewModel.events.length > 0 ? (
              <div className={styles.viewport} ref={viewModel.parentRef}>
                <div
                  style={{ height: `${viewModel.totalHeight}px` }}
                  className={styles.canvas}
                >
                  {viewModel.virtualRows.map(({ virtualItem, event }) => (
                    <div
                      key={event.id}
                      className={styles.row}
                      style={{
                        transform: `translateY(${virtualItem.start}px)`,
                      }}
                    >
                      <SectionCard className={styles["event-item"]}>
                        <div className={styles["event-main"]}>
                          <div className={styles["title-wrap"]}>
                            <h3>{String(event.title ?? "Untitled Event")}</h3>
                            <Badge tone={toStatusTone(event.status)}>
                              {String(event.status ?? "active")}
                            </Badge>
                          </div>

                          <p className={styles.description}>
                            {String(event.description ?? "No description")}
                          </p>

                          <div className={styles.pills}>
                            <span className={styles["closing-pill"]}>
                              {String(event.closingInText ?? "closing soon")}
                            </span>
                            <span className={styles["delivery-pill"]}>
                              {String(
                                event.deliveryInText ?? "delivery schedule",
                              )}
                            </span>
                          </div>
                        </div>

                        <div className={styles["event-meta"]}>
                          <p>
                            <CalendarDays size={14} />
                            <span>
                              Closing {String(event.closingDate ?? "-")} |
                              Collection {String(event.collectionDate ?? "-")}
                            </span>
                          </p>
                          <p>
                            <ShoppingBag size={14} />
                            <span>Buy {Number(event.buyCount ?? 0)}</span>
                          </p>
                          <p>
                            <Truck size={14} />
                            <span>
                              Admin fee {String(event.adminFee ?? "0")}
                            </span>
                          </p>
                        </div>

                        <div className={styles.actions}>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => viewModel.onEditEvent(event.id)}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => viewModel.onViewDetail(event.id)}
                          >
                            View Detail
                          </Button>
                          <Button
                            type="button"
                            variant="primary"
                            onClick={() => viewModel.onShareEvent(event.id)}
                          >
                            Share
                          </Button>
                        </div>
                      </SectionCard>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {viewModel.events.length === 0 ? (
              <>
                <Alert tone="info">No hosted events yet.</Alert>
                <Button
                  type="button"
                  fullWidth
                  onClick={viewModel.onCreateFirstEvent}
                >
                  Create first event
                </Button>
              </>
            ) : null}
          </div>
        ) : null}
      </div>
    </AppLayout>
  );
}

export default ListMyEventsPage;
