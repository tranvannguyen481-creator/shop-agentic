import { APP_PATHS } from "../../../../app/route-config";
import { APP_TABS } from "../../../../shared/components/app-shell/app-tabs";
import AppLayout from "../../../../shared/layouts/app-layout";
import ManageOrdersView from "../../components/manage-orders-view";
import { useManageOrdersPage } from "../../hooks/use-manage-orders-page";

export const routePath = APP_PATHS.manageOrders;

function ManageOrdersPage() {
  const viewModel = useManageOrdersPage();

  return (
    <AppLayout activeTab={APP_TABS.all}>
      <ManageOrdersView viewModel={viewModel} />
    </AppLayout>
  );
}

export default ManageOrdersPage;
