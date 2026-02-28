import {
  ArrowUpDown,
  CalendarDays,
  RefreshCw,
  ShoppingBag,
  Users,
} from "lucide-react";
import { ReactNode } from "react";
import SearchBar from "../../../../shared/components/search-bar";
import {
  Alert,
  Badge,
  EmptyState,
  SectionCard,
  Skeleton,
  Spinner,
  Tabs,
} from "../../../../shared/components/ui";
import styles from "./index.module.scss";

export type EventFilterTab = "all" | "active" | "closed";
export type EventSortKey = "closing" | "title";

export interface EventItem {
  id: string;
  title?: string;
  description?: string;
  status?: string;
  closingDate?: string;
  closingInText?: string;
  deliveryInText?: string;
  groupName?: string;
  hostDisplayName?: string;
  buyCount?: number;
  bannerPreviewUrls?: string[];
  [key: string]: unknown;
}

interface EventListViewProps {
  events: EventItem[];
  total: number;
  activeCount: number;
  closedCount: number;
  isLoading: boolean;
  isFetching: boolean;
  error: string | null;
  search: string;
  onSearchChange: (v: string) => void;
  filterTab: EventFilterTab;
  onFilterTabChange: (t: EventFilterTab) => void;
  sortKey: EventSortKey;
  onSortChange: (k: EventSortKey) => void;
  onRefresh: () => void;
  /** Shown when the list is empty and no search/filter is active */
  emptyTitle?: string;
  emptyDescription?: string;
  /** Render the action button row for each card */
  renderActions: (event: EventItem) => ReactNode;
  /** Whether to show the buy-count badge on cards */
  showBuyCount?: boolean;
  /** Whether to show the group-name chip on cards */
  showGroupName?: boolean;
}

const FILTER_TABS = [
  { key: "all" as EventFilterTab, label: "All" },
  { key: "active" as EventFilterTab, label: "Active" },
  { key: "closed" as EventFilterTab, label: "Closed" },
];

const toStatusTone = (status: string | undefined) => {
  const s = String(status ?? "").toLowerCase();
  if (s === "closed" || s.includes("close") || s.includes("end"))
    return "danger" as const;
  if (s.includes("draft") || s.includes("pending")) return "warning" as const;
  return "success" as const;
};

const isClosed = (status: string | undefined) => {
  const s = String(status ?? "").toLowerCase();
  return s === "closed" || s.includes("close") || s.includes("end");
};

function EventListView({
  events,
  total,
  activeCount,
  closedCount,
  isLoading,
  isFetching,
  error,
  search,
  onSearchChange,
  filterTab,
  onFilterTabChange,
  sortKey,
  onSortChange,
  onRefresh,
  emptyTitle = "No events yet",
  emptyDescription = "Events will appear here.",
  renderActions,
  showBuyCount = false,
  showGroupName = false,
}: EventListViewProps) {
  const tabItems = FILTER_TABS.map((t) => ({
    key: t.key,
    label:
      t.key === "active"
        ? `Active${activeCount > 0 ? ` (${activeCount})` : ""}`
        : t.key === "closed"
          ? `Closed${closedCount > 0 ? ` (${closedCount})` : ""}`
          : `All${total > 0 ? ` (${total})` : ""}`,
  }));

  const hasFilter = !!search || filterTab !== "all";

  return (
    <div className={styles.root}>
      {/* Search */}
      <SearchBar value={search} onValueChange={onSearchChange} />

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <Tabs
          items={tabItems}
          activeKey={filterTab}
          onChange={(k) => onFilterTabChange(k as EventFilterTab)}
          className={styles.filterTabs}
        />

        <div className={styles.toolbarRight}>
          <div className={styles.sortWrap}>
            <ArrowUpDown size={13} className={styles.sortIcon} />
            <select
              className={styles.sortSelect}
              value={sortKey}
              onChange={(e) => onSortChange(e.target.value as EventSortKey)}
              aria-label="Sort events"
            >
              <option value="closing">Closing soon</option>
              <option value="title">Name A–Z</option>
            </select>
          </div>

          <button
            type="button"
            className={styles.refreshBtn}
            onClick={onRefresh}
            disabled={isFetching}
            aria-label="Refresh"
          >
            {isFetching ? <Spinner size={14} /> : <RefreshCw size={14} />}
          </button>
        </div>
      </div>

      {/* Loading skeletons */}
      {isLoading ? (
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

      {/* Error */}
      {!isLoading && error ? <Alert tone="error">{error}</Alert> : null}

      {/* Empty state */}
      {!isLoading && !error && events.length === 0 ? (
        <SectionCard className={styles.emptyCard}>
          <EmptyState
            icon={<CalendarDays />}
            title={hasFilter ? "No matching events" : emptyTitle}
            description={
              hasFilter
                ? "Try adjusting your search or filter."
                : emptyDescription
            }
          />
        </SectionCard>
      ) : null}

      {/* Event list */}
      {!isLoading && events.length > 0 ? (
        <div className={styles.eventList}>
          {events.map((event) => {
            const closed = isClosed(event.status);
            const buyCount =
              showBuyCount && typeof event.buyCount === "number"
                ? event.buyCount
                : null;
            const bannerUrl = Array.isArray(event.bannerPreviewUrls)
              ? (event.bannerPreviewUrls[0] as string | undefined)
              : undefined;

            return (
              <SectionCard
                key={event.id}
                className={[styles.eventItem, closed ? styles.inactive : ""]
                  .filter(Boolean)
                  .join(" ")}
              >
                {/* Banner */}
                {bannerUrl ? (
                  <div className={styles.bannerThumb}>
                    <img src={bannerUrl} alt="" loading="lazy" />
                  </div>
                ) : null}

                {/* Header */}
                <div className={styles.eventHeader}>
                  <h3 className={styles.title}>
                    {String(event.title ?? "Untitled Event")}
                  </h3>
                  <Badge tone={toStatusTone(event.status)}>
                    {String(event.status ?? "active")}
                  </Badge>
                </div>

                {/* Meta row */}
                {(showGroupName && event.groupName) || event.hostDisplayName ? (
                  <div className={styles.metaRow}>
                    {showGroupName && event.groupName ? (
                      <span className={styles.groupChip}>
                        <Users size={11} />
                        <span>{String(event.groupName)}</span>
                      </span>
                    ) : null}
                    {event.hostDisplayName ? (
                      <span className={styles.hostChip}>
                        {String(event.hostDisplayName)}
                      </span>
                    ) : null}
                  </div>
                ) : null}

                {/* Description */}
                <p className={styles.description}>
                  {String(event.description ?? "")}
                </p>

                {/* Info row: pills + buy count */}
                <div className={styles.infoRow}>
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

                  {buyCount !== null && buyCount > 0 ? (
                    <span className={styles.buyCount}>
                      <ShoppingBag size={11} />
                      {buyCount} {buyCount === 1 ? "order" : "orders"}
                    </span>
                  ) : null}
                </div>

                {/* Actions (page-specific) */}
                <div className={styles.actions}>{renderActions(event)}</div>
              </SectionCard>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export default EventListView;
