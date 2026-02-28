import { APP_PATHS } from "../../../../app/route-config";
import AppLayout from "../../../../shared/layouts/app-layout";
import ListMyGroupsView from "../../components/list-my-groups-view";
import { useListMyGroupsPage } from "../../hooks/use-list-my-groups-page";
import styles from "./index.module.scss";

export const routePath = APP_PATHS.listMyGroups;

function ListMyGroupsPage() {
  const viewModel = useListMyGroupsPage();

  return (
    <AppLayout>
      <section className={styles.page}>
        <ListMyGroupsView viewModel={viewModel} />
      </section>
    </AppLayout>
  );
}

export default ListMyGroupsPage;
