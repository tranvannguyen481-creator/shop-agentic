import { CalendarDays, Eye, Pencil, Plus, Share2 } from "lucide-react";
import "swiper/css";
import "swiper/css/pagination";
import { Autoplay, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
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
                        {Array.isArray(event.bannerPreviewUrls) &&
                        event.bannerPreviewUrls.length > 0 ? (
                          <div className={styles["banner-slider"]}>
                            <Swiper
                              modules={[Pagination, Autoplay]}
                              pagination={{ clickable: true }}
                              autoplay={{
                                delay: 3000,
                                disableOnInteraction: false,
                              }}
                              loop={event.bannerPreviewUrls.length > 1}
                              className={styles["banner-swiper"]}
                            >
                              {event.bannerPreviewUrls.map(
                                (url: string, idx: number) => (
                                  <SwiperSlide key={idx}>
                                    <img
                                      src={url}
                                      alt={`Banner ${idx + 1}`}
                                      className={styles["banner-img"]}
                                    />
                                  </SwiperSlide>
                                ),
                              )}
                            </Swiper>
                          </div>
                        ) : null}
                        <div className={styles["event-header"]}>
                          <h3 className={styles.title}>
                            {String(event.title ?? "Untitled Event")}
                          </h3>
                          <Badge tone={toStatusTone(event.status)}>
                            {String(event.status ?? "active")}
                          </Badge>
                        </div>

                        <p className={styles.description}>
                          {String(event.description ?? "No description")}
                        </p>

                        <div className={styles.pills}>
                          <span className={styles["closing-pill"]}>
                            <CalendarDays size={11} />
                            {String(event.closingInText ?? "closing soon")}
                          </span>
                          <span className={styles["delivery-pill"]}>
                            {String(
                              event.deliveryInText ?? "delivery schedule",
                            )}
                          </span>
                        </div>

                        <div className={styles.actions}>
                          <Button
                            type="button"
                            variant="outline"
                            className={styles["action-btn"]}
                            onClick={() => viewModel.onEditEvent(event.id)}
                          >
                            <Pencil size={13} />
                            <span>Edit</span>
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            className={styles["action-btn"]}
                            onClick={() => viewModel.onViewDetail(event.id)}
                          >
                            <Eye size={13} />
                            <span>View</span>
                          </Button>
                          <Button
                            type="button"
                            variant="primary"
                            className={styles["action-btn"]}
                            onClick={() => viewModel.onShareEvent(event.id)}
                          >
                            <Share2 size={13} />
                            <span>Share</span>
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
                  <Plus size={16} />
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
