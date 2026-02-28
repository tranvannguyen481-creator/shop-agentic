import { CalendarDays, Eye, RefreshCw, Users } from "lucide-react";
import { useHomePage } from "../../../../features/event/hooks/use-home-page";
import SearchBar from "../../../../shared/components/search-bar";
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  SectionCard,
  Skeleton,
} from "../../../../shared/components/ui";
import AppLayout from "../../../../shared/layouts/app-layout";
import styles from "./index.module.scss";

function HomePage() {
  const vm = useHomePage();

  const toStatusTone = (status: string | undefined) => {
    const s = String(status ?? "").toLowerCase();
    if (s === "closed") return "danger" as const;
    if (s.includes("draft") || s.includes("pending")) return "warning" as const;
    return "success" as const;
  };

  const isClosed = (status: string | undefined) =>
    String(status ?? "").toLowerCase() === "closed";

  return (
    <AppLayout>
      <SearchBar value={vm.search} onValueChange={vm.onSearchChange} />

      {vm.isLoading ? (
        <div className={styles.loadingBlock}>
          {[0, 1, 2].map((i) => (
            <SectionCard key={i} className={styles.loadingCard}>
              <Skeleton height={18} width="55%" />
              <Skeleton height={14} width="88%" />
              <Skeleton height={14} width="70%" />
              <Skeleton height={28} width="40%" />
            </SectionCard>
          ))}
        </div>
      ) : null}

      {!vm.isLoading && vm.error ? (
        <Alert tone="error">{vm.error}</Alert>
      ) : null}

      {!vm.isLoading && !vm.error && vm.events.length === 0 ? (
        <SectionCard className={styles.emptyCard}>
          <EmptyState
            icon={<CalendarDays />}
            title="No events yet"
            description="Events from your groups will appear here. Join a group to see its events."
          />
        </SectionCard>
      ) : null}

      {!vm.isLoading && vm.events.length > 0 ? (
        <div className={styles.eventList}>
          {vm.events.map((event) => {
            const closed = isClosed(event.status);
            return (
              <SectionCard
                key={event.id}
                className={[styles.eventItem, closed ? styles.inactive : ""]
                  .filter(Boolean)
                  .join(" ")}
              >
                <div className={styles.eventHeader}>
                  <h3 className={styles.title}>
                    {String(event.title ?? "Untitled Event")}
                  </h3>
                  <Badge tone={toStatusTone(event.status)}>
                    {String(event.status ?? "active")}
                  </Badge>
                </div>

                {event.groupName ? (
                  <div className={styles.groupChip}>
                    <Users size={11} />
                    <span>{String(event.groupName)}</span>
                  </div>
                ) : null}

                <p className={styles.description}>
                  {String(event.description ?? "")}
                </p>

                {closed ? (
                  <div className={styles.closedBanner}>
                    <CalendarDays size={11} />
                    Closing date passed — event closed
                  </div>
                ) : (
                  <div className={styles.pills}>
                    {event.closingInText ? (
                      <span className={styles["closing-pill"]}>
                        <CalendarDays size={11} />
                        {String(event.closingInText)}
                      </span>
                    ) : null}
                    {event.deliveryInText ? (
                      <span className={styles["delivery-pill"]}>
                        {String(event.deliveryInText)}
                      </span>
                    ) : null}
                  </div>
                )}

                <div className={styles.actions}>
                  {closed ? (
                    <Button
                      type="button"
                      variant="primary"
                      className={styles["rehost-btn"]}
                      disabled={
                        vm.isReHosting &&
                        vm.reHostingEventId === event.id
                      }
                      onClick={() => vm.onReHost(event.id)}
                    >
                      <RefreshCw size={13} />
                      <span>
                        {vm.isReHosting && vm.reHostingEventId === event.id
                          ? "Creating..."
                          : "Re-host"}
                      </span>
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="secondary"
                      className={styles["action-btn"]}
                      onClick={() => vm.onViewDetail(event.id)}
                    >
                      <Eye size={13} />
                      <span>View</span>
                    </Button>
                  )}
                </div>
              </SectionCard>
            );
          })}
        </div>
      ) : null}
    </AppLayout>
  );
}

export default HomePage;
