import { Pencil, Plus, Share2 } from "lucide-react";
import { APP_PATHS } from "../../../../app/route-config";
import { Button } from "../../../../shared/components/ui";
import AppLayout from "../../../../shared/layouts/app-layout";
import EventListView, {
  type EventItem,
} from "../../components/event-list-view";
import { useListMyEventsPage } from "../../hooks/use-list-my-events-page";
import styles from "./index.module.scss";

export const routePath = APP_PATHS.listMyEvents;

function ListMyEventsPage() {
  const vm = useListMyEventsPage();

  const renderActions = (event: EventItem) => (
    <>
      <Button
        type="button"
        variant="outline"
        className={styles["action-btn"]}
        onClick={() => vm.onEditEvent(event.id)}
      >
        <Pencil size={13} />
        <span>Edit</span>
      </Button>
      <Button
        type="button"
        variant="primary"
        className={styles["action-btn"]}
        onClick={() => vm.onShareEvent(event.id)}
      >
        <Share2 size={13} />
        <span>Share</span>
      </Button>
    </>
  );

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
        emptyTitle="No hosted events yet"
        emptyDescription="Create your first event to get started."
        renderActions={renderActions}
        showBuyCount
      />

      {!vm.isLoading && vm.total === 0 ? (
        <Button
          type="button"
          fullWidth
          onClick={vm.onCreateFirstEvent}
          className={styles["create-btn"]}
        >
          <Plus size={16} />
          Create first event
        </Button>
      ) : null}
    </AppLayout>
  );
}

export default ListMyEventsPage;
