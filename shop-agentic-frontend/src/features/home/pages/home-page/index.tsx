import { Eye, RefreshCw } from "lucide-react";
import EventListView, {
  type EventItem,
} from "../../../../features/event/components/event-list-view";
import { useHomePage } from "../../../../features/event/hooks/use-home-page";
import { Button } from "../../../../shared/components/ui";
import AppLayout from "../../../../shared/layouts/app-layout";
import styles from "./index.module.scss";

function HomePage() {
  const vm = useHomePage();

  const isClosed = (status: string | undefined) => {
    const s = String(status ?? "").toLowerCase();
    return s === "closed" || s.includes("close") || s.includes("end");
  };

  const renderActions = (event: EventItem) => {
    const closed = isClosed(event.status);
    return closed ? (
      <Button
        type="button"
        variant="primary"
        className={styles["action-btn"]}
        disabled={vm.isReHosting && vm.reHostingEventId === event.id}
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
    );
  };

  return (
    <AppLayout>
      <EventListView
        events={vm.events}
        total={vm.total}
        activeCount={vm.activeCount}
        closedCount={vm.closedCount}
        isLoading={vm.isLoading}
        isFetching={vm.isFetching}
        error={vm.error}
        search={vm.search}
        onSearchChange={vm.onSearchChange}
        filterTab={vm.filterTab}
        onFilterTabChange={vm.onFilterTabChange}
        sortKey={vm.sortKey}
        onSortChange={vm.onSortChange}
        onRefresh={vm.onRefresh}
        emptyTitle="No events yet"
        emptyDescription="Events from your groups will appear here. Join a group to see its events."
        renderActions={renderActions}
        showGroupName
        showBuyCount
      />
    </AppLayout>
  );
}

export default HomePage;
